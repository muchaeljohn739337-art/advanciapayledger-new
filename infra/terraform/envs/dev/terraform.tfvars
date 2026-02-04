# Development Environment Configuration
# This file contains all the variables specific to the development environment

# General Configuration
environment = "dev"
region = "us-east-1"
project_name = "advancia-dev"
owner = "dev-team"

# EKS Cluster Configuration
cluster_name = "advancia-dev-cluster"
kubernetes_version = "1.28"
cluster_endpoint_public_access = true

# Node Group Configuration
general_node_group_size = 2
general_node_group_min_size = 1
general_node_group_max_size = 3

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
database_subnet_cidrs = ["10.0.20.0/24", "10.0.21.0/24"]

# Database Configuration
postgres_instance_class = "db.t3.micro"
postgres_allocated_storage = 20
postgres_max_allocated_storage = 100
postgres_backup_retention_period = 7
postgres_skip_final_snapshot = true
postgres_deletion_protection = false

# Redis Configuration
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1
redis_automatic_failover_enabled = false
redis_multi_az_enabled = false

# S3 Buckets
s3_buckets = {
  "advancia-dev-logs" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 30
      storage_class = "STANDARD_IA"
    }
  }
  "advancia-dev-backups" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 60
      storage_class = "GLACIER"
    }
  }
  "advancia-dev-static" = {
    versioning = false
    lifecycle_rule = {
      enabled = false
    }
  }
}

# Security Configuration
enable_security_hub = false
enable_guardduty = false
enable_macie = false
enable_config_rules = false

# Monitoring Configuration
enable_cloudwatch_alarms = true
enable_sns_notifications = false
log_retention_days = 14

# Cost Optimization
enable_cost_allocation_tags = true
enable_budget_alerts = false
monthly_budget_limit = 500

# Networking Configuration
enable_nat_gateway = true
enable_vpc_flow_logs = false
enable_dns_hostnames = true
enable_dns_support = true

# Tags
tags = {
  Environment = "development"
  Project = "advancia"
  Owner = "dev-team"
  ManagedBy = "terraform"
  CostCenter = "engineering"
  DataClassification = "internal"
}
