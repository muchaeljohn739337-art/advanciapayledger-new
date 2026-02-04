variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "advancia-prod"
}

variable "vpc_id" {
  description = "VPC ID for the cluster"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the cluster"
  type        = string
}

variable "letsencrypt_email" {
  description = "Email for Let's Encrypt certificates"
  type        = string
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
}

variable "smtp_host" {
  description = "SMTP server host"
  type        = string
  default     = "smtp.gmail.com:587"
}

variable "smtp_from" {
  description = "From email address for alerts"
  type        = string
}

variable "default_email" {
  description = "Default email for alerts"
  type        = string
}

variable "critical_email" {
  description = "Critical alert email"
  type        = string
}

variable "warning_email" {
  description = "Warning alert email"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {
    Project     = "Advancia PayLedger"
    Environment = "production"
  }
}
