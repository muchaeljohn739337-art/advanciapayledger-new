variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "storage_class_name" {
  description = "Storage class name for persistent storage"
  type        = string
  default     = "gp2"
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
  default     = {}
}
