# ECS on EC2 Deployment Guide

## 🚀 Quick Start

This guide walks you through deploying the Keeps Light application on AWS ECS using EC2 instances.

---

## 📋 Prerequisites

- AWS CLI configured with credentials
- Terraform installed (v1.0+)
- Docker installed
- AWS account with appropriate permissions
- SSH key pair created in AWS

---

## 🔧 Step 1: Build and Push Docker Image

### 1.1 Create ECR Repository

```bash
cd terraform

# Initialize Terraform (if not already done)
terraform init

# Create only the ECR repository first
terraform apply -target=aws_ecr_repository.keeps_light

# Get the ECR repository URL
export ECR_URL=$(terraform output -raw ecr_repository_url)
echo $ECR_URL
```

### 1.2 Authenticate Docker to ECR

```bash
# Get your AWS account ID and region
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URL
```

### 1.3 Build and Push Image

```bash
# Go back to project root
cd ..

# Build Docker image
docker build -t keeps-light:latest .

# Tag for ECR
docker tag keeps-light:latest $ECR_URL:latest

# Push to ECR
docker push $ECR_URL:latest

# Verify image was pushed
aws ecr describe-images --repository-name keeps-light
```

---

## 🏗️ Step 2: Deploy ECS Infrastructure

### 2.1 Configure Variables

```bash
cd terraform

# Create terraform.tfvars if it doesn't exist
cat > terraform.tfvars <<EOF
aws_region   = "us-east-1"
project_name = "keeps-light"
db_password  = "your-secure-password-here"
my_ip        = "$(curl -s ifconfig.me)/32"
key_name     = "your-key-pair-name"
github_repo  = "https://github.com/yourusername/Keeps-Light.git"
EOF
```

### 2.2 Plan Deployment

```bash
# Review what will be created
terraform plan

# You should see:
# - ECR repository (already created)
# - ECS cluster
# - ECS task definition
# - ECS service
# - EC2 launch template and ASG
# - Updated ALB target group
# - IAM roles and policies
# - CloudWatch log group
```

### 2.3 Apply Infrastructure

```bash
# Deploy all infrastructure
terraform apply

# This will take approximately 5-10 minutes
```

---

## ✅ Step 3: Verify Deployment

### 3.1 Check ECS Cluster

```bash
# Get cluster name
export CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)

# Check cluster status
aws ecs describe-clusters --clusters $CLUSTER_NAME

# List services
aws ecs list-services --cluster $CLUSTER_NAME

# Check service status
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services keeps-light-service
```

### 3.2 Check Running Tasks

```bash
# List tasks
aws ecs list-tasks --cluster $CLUSTER_NAME

# Get task details
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER_NAME --query 'taskArns[0]' --output text)
aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $TASK_ARN
```

### 3.3 Check EC2 Instances

```bash
# List ECS instances
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=keeps-light-ecs-instance" \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \
  --output table
```

### 3.4 Test Application

```bash
# Get ALB DNS name
export ALB_DNS=$(terraform output -raw alb_dns_name)

# Test API endpoint
curl http://$ALB_DNS/api/notes

# Should return: []

# Create a test note
curl -X POST http://$ALB_DNS/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ECS Test Note",
    "content": "Testing ECS deployment",
    "color": "bg-blue",
    "is_pinned": false
  }'

# Verify note was created
curl http://$ALB_DNS/api/notes

# Open in browser
echo "Application URL: http://$ALB_DNS"
```

---

## 📊 Step 4: Monitor Deployment

### 4.1 View Container Logs

```bash
# View logs in CloudWatch
aws logs tail /ecs/keeps-light --follow

# Or view specific task logs
TASK_ID=$(aws ecs list-tasks --cluster $CLUSTER_NAME --query 'taskArns[0]' --output text | cut -d'/' -f3)
aws logs tail /ecs/keeps-light --follow --log-stream-name-prefix ecs/keeps-light/$TASK_ID
```

### 4.2 Check Health Status

```bash
# Check target group health
TG_ARN=$(aws elbv2 describe-target-groups \
  --names keeps-light-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

### 4.3 View Container Insights

```bash
# Open CloudWatch Container Insights in AWS Console
echo "https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#container-insights:infrastructure/map/$CLUSTER_NAME"
```

---

## 🔄 Step 5: Update Application

### 5.1 Build New Image

```bash
# Make code changes, then rebuild
docker build -t keeps-light:latest .

# Tag with version
docker tag keeps-light:latest $ECR_URL:v1.1
docker tag keeps-light:latest $ECR_URL:latest

# Push both tags
docker push $ECR_URL:v1.1
docker push $ECR_URL:latest
```

### 5.2 Force New Deployment

```bash
# ECS will automatically pull the latest image
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service keeps-light-service \
  --force-new-deployment

# Monitor deployment
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services keeps-light-service \
  --query 'services[0].deployments'
```

---

## 🐛 Troubleshooting

### Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services keeps-light-service \
  --query 'services[0].events[0:10]'

# Check stopped tasks
aws ecs list-tasks \
  --cluster $CLUSTER_NAME \
  --desired-status STOPPED

# Get stopped task details
STOPPED_TASK=$(aws ecs list-tasks --cluster $CLUSTER_NAME --desired-status STOPPED --query 'taskArns[0]' --output text)
aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $STOPPED_TASK
```

### Container Health Check Failing

```bash
# SSH into EC2 instance
INSTANCE_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=keeps-light-ecs-instance" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

ssh -i your-key.pem ec2-user@$INSTANCE_IP

# Check Docker containers
docker ps
docker logs <container-id>

# Check ECS agent
sudo docker ps | grep ecs-agent
sudo cat /var/log/ecs/ecs-agent.log
```

### Database Connection Issues

```bash
# Test database connectivity from EC2
mysql -h $(terraform output -raw rds_endpoint) -u admin -p

# Check security group rules
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=keeps-light-db-sg"
```

### Image Pull Errors

```bash
# Verify ECR permissions
aws ecr get-repository-policy --repository-name keeps-light

# Check task execution role
aws iam get-role --role-name keeps-light-ecs-task-execution-role

# Verify image exists
aws ecr describe-images --repository-name keeps-light
```

---

## 📈 Scaling

### Manual Scaling

```bash
# Scale to 4 tasks
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service keeps-light-service \
  --desired-count 4

# Scale EC2 instances
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name keeps-light-ecs-asg \
  --desired-capacity 2
```

### Auto Scaling (Optional)

Add to `ecs_service.tf`:

```hcl
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 4
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu_policy" {
  name               = "cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

---

## 🧹 Cleanup

### Destroy Infrastructure

```bash
cd terraform

# Destroy all resources
terraform destroy

# Confirm by typing 'yes'
```

### Delete ECR Images

```bash
# Delete all images in repository
aws ecr batch-delete-image \
  --repository-name keeps-light \
  --image-ids "$(aws ecr list-images --repository-name keeps-light --query 'imageIds[*]' --output json)"
```

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

### Free Tier (First 12 Months)

- EC2: 750 hours/month FREE
- RDS: 750 hours/month FREE
- ALB: 750 hours/month FREE
- ECR: 500MB FREE
- CloudWatch: 5GB FREE

**Total with free tier: ~$0-2/month** 🎉

---

## 📚 Additional Resources

- [ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

*Deployment guide for ECS on EC2*  
*Last updated: November 27, 2025*
