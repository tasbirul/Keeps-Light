output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "The endpoint of the RDS database"
  value       = aws_db_instance.main.address
}
