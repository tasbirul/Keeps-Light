#!/bin/bash
dnf update -y
dnf install git -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install nodejs -y

mkdir -p /var/www/app
git clone ${github_repo} /var/www/app
cd /var/www/app
npm install

# Set Environment Variables
echo "DB_HOST=${db_host}" > .env
echo "DB_USER=${db_user}" >> .env
echo "DB_PASSWORD=${db_pass}" >> .env
echo "DB_NAME=${db_name}" >> .env
echo "PORT=3000" >> .env

# Verify .env file was created
cat .env

# Initialize Database
node init_db.js

npm install -g pm2
pm2 start server.js --name keeps-light
pm2 startup
pm2 save
