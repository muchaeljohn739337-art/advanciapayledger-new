output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority" {
  description = "Certificate authority data for the EKS cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "node_groups" {
  description = "Node groups created in the cluster"
  value       = module.eks.eks_managed_node_groups
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN for IAM roles"
  value       = aws_iam_openid_connect_provider.oidc_provider.arn
}

output "oidc_provider_url" {
  description = "OIDC provider URL for IAM roles"
  value       = aws_iam_openid_connect_provider.oidc_provider.url
}

output "kubeconfig" {
  description = "Kubeconfig file for the EKS cluster"
  value     = templatefile("${path.module}/kubeconfig.tpl", {
    cluster_name = module.eks.cluster_name
    endpoint     = module.eks.cluster_endpoint
    ca_data      = module.eks.cluster_certificate_authority_data
    region       = var.region
  })
  sensitive = true
}

output "ecr_registry_url" {
  description = "ECR registry URL for container images"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS region"
  value       = var.region
}

output "api_gateway_role_arn" {
  description = "IAM role ARN for API Gateway service account"
  value       = aws_iam_role.api_gateway_role.arn
}

output "auth_service_role_arn" {
  description = "IAM role ARN for Auth Service service account"
  value       = aws_iam_role.auth_service_role.arn
}

output "tenant_service_role_arn" {
  description = "IAM role ARN for Tenant Service service account"
  value       = aws_iam_role.tenant_service_role.arn
}

output "billing_service_role_arn" {
  description = "IAM role ARN for Billing Service service account"
  value       = aws_iam_role.billing_service_role.arn
}

output "monitoring_service_role_arn" {
  description = "IAM role ARN for Monitoring Service service account"
  value       = aws_iam_role.monitoring_service_role.arn
}

output "ai_orchestrator_role_arn" {
  description = "IAM role ARN for AI Orchestrator service account"
  value       = aws_iam_role.ai_orchestrator_role.arn
}

output "cluster_autoscaler_role_arn" {
  description = "IAM role ARN for Cluster Autoscaler service account"
  value       = aws_iam_role.cluster_autoscaler_role.arn
}
