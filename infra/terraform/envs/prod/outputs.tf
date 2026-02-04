output "cluster_name" {
  description = "EKS cluster name"
  value       = module.k8s_cluster.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.k8s_cluster.cluster_endpoint
}

output "postgres_endpoint" {
  description = "PostgreSQL endpoint"
  value       = module.postgres.instance_endpoint
}

output "postgres_secret_arn" {
  description = "PostgreSQL secret ARN"
  value       = module.postgres.secret_arn
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis.primary_endpoint_address
}

output "redis_secret_arn" {
  description = "Redis secret ARN"
  value       = module.redis.secret_arn
}

output "certificate_arn" {
  description = "SSL certificate ARN"
  value       = module.ingress.certificate_arn
}

output "grafana_service_name" {
  description = "Grafana service name"
  value       = module.monitoring.grafana_service_name
}
