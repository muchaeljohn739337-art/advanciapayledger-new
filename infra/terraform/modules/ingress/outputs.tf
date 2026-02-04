output "nginx_ingress_service_name" {
  description = "NGINX Ingress service name"
  value       = helm_release.nginx_ingress.name
}

output "nginx_ingress_namespace" {
  description = "NGINX Ingress namespace"
  value       = helm_release.nginx_ingress.namespace
}

output "certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.wildcard.arn
}

output "cert_manager_role_arn" {
  description = "Cert Manager IAM role ARN"
  value       = aws_iam_role.cert_manager_role.arn
}
