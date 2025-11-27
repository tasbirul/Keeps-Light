resource "aws_ecr_repository" "keeps_light" {
  name                 = "keeps-light"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-ecr"
  }
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.keeps_light.repository_url
  description = "ECR repository URL for pushing Docker images"
}
