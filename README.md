# Keeps Light

> **AWS Infrastructure demonstrating containerized microservices deployment using ECS on EC2**

[![AWS](https://img.shields.io/badge/AWS-Cloud%20Native-FF9900?logo=amazon-aws)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform)](https://www.terraform.io/)
[![ECS](https://img.shields.io/badge/Container-ECS%20on%20EC2-FF9900)](https://aws.amazon.com/ecs/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)](https://www.docker.com/)

## Table of Contents

- [Executive Summary](#-executive-summary)
- [AWS Architecture Overview](#-aws-architecture-overview)
- [Infrastructure Components](#-infrastructure-components)
- [Network Architecture](#-network-architecture)
- [Security Architecture](#-security-architecture)

## Executive Summary

**Keeps Light** is a production-ready, Google Keep-inspired note-taking application built on AWS cloud infrastructure. This project showcases enterprise-level DevOps practices, containerization strategies, and Infrastructure as Code principles using Terraform.

### Key Highlights

- **Fully Containerized**: Docker-based deployment with multi-stage builds for optimal image size
- **Container Orchestration**: Amazon ECS with EC2 launch type for cost-effective container management
- **Infrastructure as Code**: Terraform-managed infrastructure for reproducible deployments
- **High Availability**: Multi-AZ deployment with Application Load Balancer
- **Security-First**: Private subnet isolation, security group segmentation, and IAM best practices
- **Production-Ready**: Automated health checks, rolling deployments, and zero-downtime updates
- **Cost-Optimized**: ~$0-2/month with AWS Free Tier, ~$39/month without

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, Vanilla JavaScript, CSS3 (Responsive Glassmorphism UI) |
| **Backend** | Node.js 18 (ES Modules), Express.js 4.x |
| **Database** | Amazon RDS MySQL 8.0 (db.t3.micro) |
| **Container Registry** | Amazon ECR with vulnerability scanning |
| **Orchestration** | Amazon ECS with EC2 capacity providers |
| **Load Balancing** | Application Load Balancer (ALB) |
| **Networking** | Amazon VPC with public/private subnets, Internet Gateway |
| **Monitoring** | CloudWatch Container Insights, CloudWatch Logs |
| **Infrastructure** | Terraform 1.0+ (HashiCorp Configuration Language) |

## AWS Architecture Overview

### High-Level Architecture Diagram

### Data Flow

1. **User Request** → ALB (Port 80) → Health Check → Target Group
2. **ALB** → ECS Service → ECS Tasks (via dynamic port mapping)
3. **ECS Tasks** → Application Logic (Express.js)
4. **Application** → RDS MySQL (Private Subnet, Port 3306)
5. **Response** ← Application ← Database
6. **Response** ← ALB ← User

## Infrastructure Components

### 1. **Amazon VPC (Virtual Private Cloud)**

**File**: [`terraform/vpc.tf`](terraform/vpc.tf)

- **CIDR Block**: `10.0.0.0/16` (65,536 IP addresses)
- **DNS Support**: Enabled
- **DNS Hostnames**: Enabled

#### Subnet Architecture

| Subnet Type | CIDR Block | Availability Zone | Purpose |
|-------------|------------|-------------------|---------|
| Public-1 | `10.0.1.0/24` | us-east-1a | ALB, ECS EC2 Instances |
| Public-2 | `10.0.2.0/24` | us-east-1b | ALB, ECS EC2 Instances |
| Private-1 | `10.0.3.0/24` | us-east-1a | RDS MySQL Primary |
| Private-2 | `10.0.4.0/24` | us-east-1b | RDS MySQL Standby (Multi-AZ) |

**Key Features**:

- Internet Gateway for public subnet internet access
- Public route table with `0.0.0.0/0` → IGW routing
- Private subnets isolated from direct internet access
- Multi-AZ deployment for high availability

### 2. **Amazon ECS (Elastic Container Service)**

**Files**:

- [`terraform/ecs_cluster.tf`](terraform/ecs_cluster.tf)
- [`terraform/ecs_task.tf`](terraform/ecs_task.tf)
- [`terraform/ecs_service.tf`](terraform/ecs_service.tf)
- [`terraform/ecs_ec2.tf`](terraform/ecs_ec2.tf)

#### ECS Cluster Configuration

```hcl
Cluster Name: keeps-light-cluster
Launch Type: EC2
Container Insights: ENABLED
Capacity Provider: Auto Scaling Group backed
```

#### ECS Task Definition

**Container Specifications**:

- **Image**: `<ECR_URL>:latest` (from Amazon ECR)
- **CPU**: 256 units (0.25 vCPU)
- **Memory**: 512 MB
- **Network Mode**: Bridge (for dynamic port mapping)
- **Port Mapping**: Container Port 3000 → Host Port 0 (dynamic)

**Environment Variables**:

```bash
NODE_ENV=production
PORT=3000
DB_HOST=<RDS_ENDPOINT>
DB_NAME=keeps_light
DB_USER=admin
DB_PASSWORD=<SENSITIVE>
```

**Health Check Configuration**:

```json
{
  "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/notes', ...)\""],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 10
}
```

**Logging**:

- **Driver**: awslogs
- **Log Group**: `/ecs/keeps-light`
- **Region**: `us-east-1`
- **Stream Prefix**: `ecs`

#### ECS Service Configuration

```hcl
Service Name: keeps-light-service
Desired Count: 2 tasks
Launch Type: EC2
Deployment Strategy:
  - Maximum Percent: 200%
  - Minimum Healthy Percent: 50%
```

**Deployment Behavior**:

- Supports zero-downtime rolling updates
- New tasks start before old tasks terminate
- Automatic rollback on health check failures

### 3. **Auto Scaling Group (ASG) for ECS**

**File**: [`terraform/ecs_ec2.tf`](terraform/ecs_ec2.tf)

**Configuration**:

```hcl
Instance Type: t3.micro 
AMI: Amazon ECS-Optimized AMI (Amazon Linux 2)
Min Size: 1 instance
Max Size: 2 instances
Desired Capacity: 1 instance
Health Check Type: EC2
Health Check Grace Period: 300 seconds
```

**Launch Template User Data**:

```bash
#!/bin/bash
echo ECS_CLUSTER=keeps-light-cluster >> /etc/ecs/ecs.config
echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
```

**ECS Capacity Provider**:

- Managed scaling enabled
- Target capacity: 80%
- Automatic instance scaling based on task demand

### 4. **Application Load Balancer (ALB)**

**File**: [`terraform/alb.tf`](terraform/alb.tf)

**Configuration**:

```hcl
Name: keeps-light-alb
Type: Application Load Balancer
Scheme: Internet-facing
Subnets: public-1, public-2 (Multi-AZ)
Security Group: alb-sg (Port 80 from 0.0.0.0/0)
```

**Target Group**:

- **Protocol**: HTTP
- **Target Type**: Instance (for ECS EC2 launch type)
- **Deregistration Delay**: 30 seconds
- **Health Check**:
  - Path: `/api/notes`
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Healthy Threshold: 2
  - Unhealthy Threshold: 10
  - Success Code: 200

**Listener**:

- Port: 80 (HTTP)
- Default Action: Forward to target group

> **Production Note**: For production environments, add HTTPS listener with SSL/TLS certificate from AWS Certificate Manager

### 5. **Amazon RDS MySQL**

**File**: [`terraform/database.tf`](terraform/database.tf)

**Database Specifications**:

```hcl
Engine: MySQL 8.0
Instance Class: db.t3.micro 
Storage: 20 GB gp2 (General Purpose SSD)
Multi-AZ: Enabled
Publicly Accessible: false
Backup Retention: 0 days (configurable)
Database Name: keeps_light
Master Username: admin
Master Password: <var.db_password>
```

**Database Schema**:

```sql
CREATE TABLE notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    content TEXT,
    is_pinned TINYINT(1) DEFAULT 0,
    color VARCHAR(50) DEFAULT 'bg-default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Subnet Group**:

- Subnets: private-1, private-2 (Multi-AZ capable)
- Isolated from internet access

### 6. **Amazon ECR (Elastic Container Registry)**

**File**: [`terraform/ecr.tf`](terraform/ecr.tf)

**Repository Configuration**:

```hcl
Repository Name: keeps-light
Image Tag Mutability: MUTABLE
Scan on Push: ENABLED (vulnerability scanning)
```

**Docker Image Details**:

- **Base Image**: `node:18-alpine` (multi-stage build)
- **Final Image Size**: ~80-100 MB (optimized)
- **Security**: Non-root user (nodejs:1001)
- **Init System**: dumb-init for proper signal handling

## Network Architecture

### VPC Design Principles

1. **Isolation**: Private subnets for data layer (RDS)
2. **High Availability**: Multi-AZ deployment across us-east-1a and us-east-1b
3. **Internet Connectivity**: Public subnets with Internet Gateway
4. **Scalability**: /24 subnets provide 256 IP addresses each

### Route Tables

**Public Route Table**:

```
Destination          Target
10.0.0.0/16         local
0.0.0.0/0           igw-xxxxxx (Internet Gateway)
```

**Private Subnets**:

- No route to Internet Gateway (isolated)
- Access to internet via NAT Gateway (optional, not implemented for cost)

### Network Flow

```
Internet (0.0.0.0/0)
    ↓
Internet Gateway (igw)
    ↓
Public Subnets (10.0.1.0/24, 10.0.2.0/24)
    ↓
ALB → ECS Tasks → RDS (Private Subnets)
```

## Security Architecture

**File**: [`terraform/security.tf`](terraform/security.tf)

### Defense-in-Depth Strategy

#### Security Group Segmentation

**1. ALB Security Group** (`alb-sg`)

```hcl
Ingress:
  - Port: 80 (HTTP)
    Source: 0.0.0.0/0 (Internet)
    Protocol: TCP

Egress:
  - All traffic allowed (to forward to ECS tasks)
```

**2. Application Security Group** (`app-sg`)

```hcl
Ingress:
  - Ports: 32768-65535 (Dynamic port range for ECS)
    Source: alb-sg (Only from ALB)
    Protocol: TCP
  
  - Port: 22 (SSH)
    Source: <Your IP>/32 (Admin access)
    Protocol: TCP

Egress:
  - All traffic allowed (for RDS, internet, AWS API calls)
```

**3. Database Security Group** (`db-sg`)

```hcl
Ingress:
  - Port: 3306 (MySQL)
    Source: app-sg (Only from application tier)
    Protocol: TCP

Egress:
  - None (no outbound requirements)
```

### IAM Roles and Policies

#### ECS Task Execution Role

```hcl
Role: keeps-light-ecs-task-execution-role
Managed Policy: AmazonECSTaskExecutionRolePolicy

Permissions:
  - Pull images from ECR
  - Write to CloudWatch Logs
  - Retrieve secrets from Secrets Manager (if used)
```

#### ECS Instance Role

```hcl
Role: keeps-light-ecs-instance-role
Managed Policy: AmazonEC2ContainerServiceforEC2Role

Permissions:
  - Register/deregister with ECS cluster
  - Pull container images from ECR
  - Send CloudWatch metrics and logs
```

## Acknowledgments

- **AWS**: For comprehensive documentation and Free Tier
- **HashiCorp**: For Terraform and excellent learning resources
- **Docker**: For containerization technology
- **Node.js Community**: For Express.js and ecosystem
- **Google Keep**: For UI/UX inspiration
