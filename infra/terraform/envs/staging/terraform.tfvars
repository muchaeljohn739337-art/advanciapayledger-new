# Staging Environment Configuration
# This file contains all the variables specific to the staging environment

# General Configuration
environment = "staging"
region = "us-east-1"
project_name = "advancia-staging"
owner = "ops-team"

# EKS Cluster Configuration
cluster_name = "advancia-staging-cluster"
kubernetes_version = "1.28"
cluster_endpoint_public_access = false

# Node Group Configuration
general_node_group_size = 3
general_node_group_min_size = 2
general_node_group_max_size = 6

# VPC Configuration
vpc_cidr = "10.1.0.0/16"
public_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24", "10.1.12.0/24"]
database_subnet_cidrs = ["10.1.20.0/24", "10.1.21.0/24", "10.1.22.0/24"]

# Database Configuration
postgres_instance_class = "db.t3.medium"
postgres_allocated_storage = 100
postgres_max_allocated_storage = 500
postgres_backup_retention_period = 14
postgres_skip_final_snapshot = false
postgres_deletion_protection = true
postgres_maintenance_window = "sun:03:00-sun:04:00"
postgres_backup_window = "03:00-04:00"

# Redis Configuration
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1
redis_automatic_failover_enabled = true
redis_multi_az_enabled = true
redis_maintenance_window = "sun:05:00-sun:06:00"

# S3 Buckets
s3_buckets = {
  "advancia-staging-logs" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 30
      storage_class = "STANDARD_IA"
      expiration_days = 365
    }
  }
  "advancia-staging-backups" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 30
      storage_class = "STANDARD_IA"
      transition_days_2 = 90
      storage_class_2 = "GLACIER"
      expiration_days = 2555
    }
  }
  "advancia-staging-static" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 60
      storage_class = "STANDARD_IA"
    }
  }
  "advancia-staging-artifacts" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# Security Configuration
enable_security_hub = true
enable_guardduty = true
enable_macie = false
enable_config_rules = true
enable_cloudtrail = true
enable_vpc_flow_logs = true

# Monitoring Configuration
enable_cloudwatch_alarms = true
enable_sns_notifications = true
log_retention_days = 30
metric_retention_days = 15

# Cost Optimization
enable_cost_allocation_tags = true
enable_budget_alerts = true
monthly_budget_limit = 2000
budget_threshold = 80

# Networking Configuration
enable_nat_gateway = true
enable_dns_hostnames = true
enable_dns_support = true
enable_flow_log_encryption = true

# Certificate Configuration
certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/staging-cert-id"

# Route53 Configuration
route53_zone_id = "Z1EXAMPLESTAGING"
domain_name = "staging.advancia.com"

# Application Load Balancer Configuration
alb_ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"
enable_alb_logging = true
alb_log_bucket = "advancia-staging-logs"

# Auto Scaling Configuration
enable_cluster_autoscaler = true
scale_down_delay_after_add = "3m"
scale_down_unneeded_time = "10m"

# Backup Configuration
enable_cross_region_backup = true
backup_region = "us-west-2"
backup_retention_period = 30

# Tags
tags = {
  Environment = "staging"
  Project = "advancia"
  Owner = "ops-team"
  ManagedBy = "terraform"
  CostCenter = "engineering"
  DataClassification = "internal"
  Compliance = "hipaa-ready"
}
