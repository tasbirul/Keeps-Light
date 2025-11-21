variable "aws_region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  default     = "keeps-light"
}

variable "db_password" {
  description = "Master password for the RDS database"
  type        = string
  sensitive   = true
}

variable "my_ip" {
  description = "Your IP address for SSH access (CIDR format, e.g., 1.2.3.4/32)"
  type        = string
}

variable "github_repo" {
  description = "URL of the GitHub repository to clone"
  default     = "https://github.com/YOUR_USER/keeps-light.git"
}

variable "key_name" {
  description = "Name of the AWS Key Pair to use for SSH access"
  type        = string
  default     = "mykey"
}
