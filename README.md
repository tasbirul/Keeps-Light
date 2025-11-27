# Keeps Light

A cloud-native note-taking application showcasing multiple AWS deployment strategies with Infrastructure as Code.

## 🎯 Overview

This is a Google Keep-inspired web application with a Node.js backend and MySQL database. The project demonstrates **two different deployment approaches** on AWS using Terraform, allowing you to choose the best strategy for your needs.

## 🚀 Deployment Options

This repository contains **two deployment strategies** in separate branches:

### 1. Traditional EC2 Deployment (Branch: `main`)
**Status:** ✅ Production-ready  
**Best for:** Learning AWS fundamentals, simple deployments

- Auto Scaling Groups with user_data bootstrapping
- PM2 process management
- Direct EC2 deployment
- **Cost:** ~$40/month (FREE with AWS free tier)

[View EC2 Deployment Guide →](./README_EC2.md)

---

### 2. ECS on EC2 Deployment (Branch: `ecs-ec2`) ⭐ **Current Branch**
**Status:** ✅ Production-ready  
**Best for:** Container orchestration, zero-downtime deployments

- Docker containerization
- ECS cluster management
- ECR image registry
- Rolling updates with health checks
- CloudWatch Container Insights
- **Cost:** ~$39/month (FREE with AWS free tier)

[View ECS Deployment Guide →](./docs/ECS_DEPLOYMENT.md)

---

## 📊 Deployment Comparison

| Feature | EC2 (`main`) | ECS on EC2 (`ecs-ec2`) |
|---------|--------------|------------------------|
| **Deployment Method** | user_data script | Docker containers |
| **Process Management** | PM2 | ECS |
| **Deployment Time** | 6-8 minutes | 3-5 minutes |
| **Zero Downtime Updates** | ⚠️ Manual | ✅ Built-in |
| **Scaling** | Instance-level | Task + Instance |
| **Monitoring** | Basic CloudWatch | Container Insights |
| **Rollback** | Manual | ✅ Automated |
| **Cost** | ~$40/month | ~$39/month |
| **Free Tier Eligible** | ✅ Yes | ✅ Yes |

---

## 🏗️ Architecture (ECS on EC2)

```
Internet → ALB → ECS Service → Tasks (Containers) → RDS MySQL
                                  ↓
                              EC2 Instances
                                  ↑
                              ECR (Docker Images)
```

### Components:

- **Application Load Balancer** - Distributes traffic with health checks
- **ECS Cluster** - Container orchestration
- **ECS Tasks** - Running Docker containers
- **EC2 Auto Scaling Group** - Hosts ECS tasks
- **ECR** - Private Docker registry
- **RDS MySQL** - Managed database
- **VPC** - Network isolation with public/private subnets
- **CloudWatch** - Centralized logging and monitoring

---

## 💻 Tech Stack

**Backend:**
- Node.js 18
- Express.js
- MySQL 8.0 (RDS)

**Frontend:**
- HTML/CSS/JavaScript
- Responsive glassmorphism UI
- Material Icons

**Infrastructure:**
- Terraform for IaC
- Docker & Docker Compose
- AWS (VPC, EC2, ECS, ECR, RDS, ALB)
- CloudWatch for monitoring

---

## 📁 Project Structure

```
├── Dockerfile               # Container image definition
├── .dockerignore           # Docker build exclusions
├── docker-compose.yml      # Local development setup
├── public/                 # Frontend files
│   ├── index.html
│   ├── style.css
│   └── app.js
├── terraform/              # Infrastructure as Code
│   ├── ecr.tf             # Container registry
│   ├── ecs_cluster.tf     # ECS cluster
│   ├── ecs_task.tf        # Task definition
│   ├── ecs_service.tf     # ECS service
│   ├── ecs_ec2.tf         # EC2 for ECS
│   ├── vpc.tf             # Networking
│   ├── database.tf        # RDS
│   ├── alb.tf             # Load balancer
│   ├── security.tf        # Security groups
│   ├── variables.tf       # Input variables
│   └── outputs.tf         # Outputs
├── docs/                   # Documentation
│   └── ECS_DEPLOYMENT.md  # Deployment guide
├── server.js              # Express server
├── db.js                  # Database connection
├── schema.sql             # Database schema
└── package.json
```

---

## 🚀 Quick Start (ECS Deployment)

### Prerequisites

- AWS account with configured credentials
- Terraform installed (v1.0+)
- Docker installed
- AWS CLI configured
- SSH key pair in AWS

### Deploy in 3 Steps

```bash
# 1. Clone and checkout ECS branch
git clone https://github.com/tasbirul/Keeps-Light.git
cd Keeps-Light
git checkout ecs-ec2

# 2. Build and push Docker image
cd terraform
terraform init
terraform apply -target=aws_ecr_repository.keeps_light
export ECR_URL=$(terraform output -raw ecr_repository_url)

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URL

cd ..
docker build -t keeps-light:latest .
docker tag keeps-light:latest $ECR_URL:latest
docker push $ECR_URL:latest

# 3. Deploy infrastructure
cd terraform
terraform apply
```

**Deployment time:** ~5-10 minutes

**Access your application:**
```bash
terraform output alb_dns_name
```

For detailed instructions, see [ECS Deployment Guide](./docs/ECS_DEPLOYMENT.md)

---

## 🐳 Local Development

### With Docker Compose (Recommended)

```bash
# Start application and MySQL
docker-compose up -d

# Access at http://localhost:3000

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Without Docker

```bash
npm install
npm start
```

Application runs on `http://localhost:3000`

---

## ✨ Features

- ✅ Create, edit, and delete notes
- 📌 Pin important notes
- 🎨 Color-code notes (12 color options)
- 💾 Persistent storage in MySQL
- 📱 Responsive glassmorphism design
- 🔄 Zero-downtime deployments (ECS)
- 📊 Container monitoring and insights
- 🚀 Auto-scaling capabilities

---

## 🎓 Skills Demonstrated

This project showcases:

- ✅ **AWS Infrastructure** - VPC, EC2, ECS, ECR, RDS, ALB, Auto Scaling
- ✅ **Infrastructure as Code** - Terraform with modular design
- ✅ **Containerization** - Docker, multi-stage builds, optimization
- ✅ **Container Orchestration** - ECS cluster, services, tasks
- ✅ **CI/CD Concepts** - Automated deployments, rolling updates
- ✅ **Monitoring** - CloudWatch Logs, Container Insights
- ✅ **Security** - IAM roles, Security Groups, private subnets
- ✅ **Cost Optimization** - Free tier utilization, resource efficiency
- ✅ **High Availability** - Multi-AZ deployment, health checks
- ✅ **DevOps Best Practices** - IaC, containerization, automation

---

## 💰 Cost Estimate

### Monthly Costs (us-east-1)

| Service | Configuration | Cost |
|---------|--------------|------|
| EC2 t3.micro | 1 instance, 24/7 | $7.50 |
| RDS db.t3.micro | Single-AZ, 20GB | $15.00 |
| ALB | Standard | $16.00 |
| ECR Storage | 200MB | $0.02 |
| CloudWatch Logs | 1GB | $0.50 |
| **Total** | | **~$39/month** |

### With AWS Free Tier (First 12 Months)

- EC2: 750 hours/month FREE
- RDS: 750 hours/month FREE
- ALB: 750 hours/month FREE
- ECR: 500MB FREE
- CloudWatch: 5GB FREE

**Total with free tier: ~$0-2/month** 🎉

---

## 📚 Documentation

- [ECS Deployment Guide](./docs/ECS_DEPLOYMENT.md) - Complete deployment walkthrough
- [EC2 Deployment Guide](./README_EC2.md) - Traditional EC2 deployment (main branch)
- [Docker Guide](./DOCKER.md) - Local Docker development (if exists)
- [Architecture Comparison](./docs/ARCHITECTURE.md) - Detailed comparison (if exists)

---

## 🔄 Switching Between Deployment Strategies

```bash
# Switch to traditional EC2 deployment
git checkout main

# Switch to ECS deployment
git checkout ecs-ec2

# Compare branches
git diff main ecs-ec2 -- terraform/
```

---

## 🐛 Troubleshooting

### ECS Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster keeps-light-cluster \
  --services keeps-light-service \
  --query 'services[0].events[0:5]'
```

### View Container Logs

```bash
# Tail logs in real-time
aws logs tail /ecs/keeps-light --follow
```

### Health Check Failures

```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn)
```

For more troubleshooting tips, see the [ECS Deployment Guide](./docs/ECS_DEPLOYMENT.md#troubleshooting).

---

## 🤝 Contributing

This is a portfolio project, but suggestions and improvements are welcome!

---

## 📄 License

ISC

---

## 👤 Author

**Tasbirul Islam**

- Portfolio: [Your Portfolio URL]
- LinkedIn: [Your LinkedIn]
- GitHub: [@tasbirul](https://github.com/tasbirul)

---

## 🌟 Acknowledgments

- Inspired by Google Keep
- Built with AWS best practices
- Terraform AWS Provider documentation
- Docker best practices

---

**Current Branch:** `ecs-ec2` (ECS on EC2 Deployment)  
**Alternative Branch:** `main` (Traditional EC2 Deployment)

*Choose the deployment strategy that best fits your needs!*
