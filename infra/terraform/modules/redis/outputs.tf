output "primary_endpoint_address" {
  description = "Redis primary endpoint address"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "primary_endpoint_port" {
  description = "Redis primary endpoint port"
  value       = aws_elasticache_replication_group.redis.port
}

output "reader_endpoint_address" {
  description = "Redis reader endpoint address"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "auth_token" {
  description = "Redis auth token"
  value       = var.auth_token != null ? var.auth_token : random_password.redis_auth_token.result
  sensitive   = true
}

output "cluster_id" {
  description = "Redis cluster ID"
  value       = aws_elasticache_replication_group.redis.id
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.redis.arn
}

output "secret_name" {
  description = "Secrets Manager secret name"
  value       = aws_secretsmanager_secret.redis.name
}
