# MySQL Setup Guide

## Local Development Setup

### 1. Install MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
```

**Windows:**
Download and install from [mysql.com](https://dev.mysql.com/downloads/installer/)

### 2. Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE keeps_light;

# Exit MySQL
exit;
```

### 3. Run Schema

```bash
mysql -u root -p keeps_light < schema.sql
```

### 4. Configure Environment

Update `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=keeps_light
PORT=3000
```

### 5. Install Dependencies & Start

```bash
npm install
npm start
```

---

## AWS RDS Setup (for 3-Tier Deployment)

### 1. Create RDS Instance

1. Go to AWS RDS Console
2. Click "Create database"
3. Choose **MySQL**
4. Select **Free tier** template (for learning)
5. Settings:
   - DB instance identifier: `keeps-light-db`
   - Master username: `admin`
   - Master password: (create a strong password)
6. Instance configuration:
   - DB instance class: `db.t3.micro` (free tier)
7. Storage:
   - Allocated storage: 20 GB
8. Connectivity:
   - VPC: Default VPC
   - Public access: **Yes** (for testing; use VPC peering in production)
   - VPC security group: Create new (allow port 3306)
9. Additional configuration:
   - Initial database name: `keeps_light`
10. Click **Create database**

### 2. Configure Security Group

1. Go to EC2 > Security Groups
2. Find the RDS security group
3. Edit inbound rules:
   - Type: MySQL/Aurora
   - Port: 3306
   - Source: Your IP (for testing) or EC2 security group (for production)

### 3. Get RDS Endpoint

1. Go to RDS Console
2. Click on your database instance
3. Copy the **Endpoint** (e.g., `keeps-light-db.xxxxx.us-east-1.rds.amazonaws.com`)

### 4. Update Environment Variables

For AWS deployment, update `.env`:
```env
DB_HOST=keeps-light-db.xxxxx.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_rds_password
DB_NAME=keeps_light
PORT=3000
```

### 5. Run Schema on RDS

```bash
mysql -h keeps-light-db.xxxxx.us-east-1.rds.amazonaws.com -u admin -p keeps_light < schema.sql
```

---

## 3-Tier Architecture on AWS

### Tier 1: Frontend (S3 + CloudFront)
- Upload `index.html`, `style.css`, `app.js` to S3
- Enable static website hosting
- Configure CloudFront for CDN

### Tier 2: Backend (EC2 or Elastic Beanstalk)
- Deploy Node.js server
- Configure environment variables
- Set up security groups to allow traffic from frontend

### Tier 3: Database (RDS MySQL)
- Already configured above
- Ensure security group allows traffic from backend

---

## Troubleshooting

### Connection Issues
- Check security group rules
- Verify RDS endpoint is correct
- Ensure database exists
- Check credentials in `.env`

### Migration from SQLite
Your existing SQLite data won't automatically transfer. To migrate:
1. Export data from SQLite
2. Import into MySQL using the schema
3. Or start fresh (recommended for learning)
