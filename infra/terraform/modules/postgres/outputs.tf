output "instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "instance_host" {
  description = "RDS instance host"
  value       = aws_db_instance.postgres.address
}

output "instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgres.port
}

output "instance_database" {
  description = "RDS instance database name"
  value       = aws_db_instance.postgres.db_name
}

output "instance_username" {
  description = "RDS instance username"
  value       = aws_db_instance.postgres.username
}

output "instance_password" {
  description = "RDS instance password"
  value       = random_password.postgres_password.result
  sensitive   = true
}

output "instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.postgres.arn
}

output "replica_endpoint" {
  description = "RDS replica endpoint"
  value       = var.create_read_replica ? aws_db_instance.postgres_replica[0].endpoint : null
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.postgres.arn
}

output "secret_name" {
  description = "Secrets Manager secret name"
  value       = aws_secretsmanager_secret.postgres.name
}
