# Production Environment Configuration
# This file contains all the variables specific to the production environment

# General Configuration
environment = "prod"
region = "us-east-1"
project_name = "advancia-prod"
owner = "ops-team"

# EKS Cluster Configuration
cluster_name = "advancia-prod-cluster"
kubernetes_version = "1.28"
cluster_endpoint_public_access = false

# Node Group Configuration
general_node_group_size = 5
general_node_group_min_size = 3
general_node_group_max_size = 10

# VPC Configuration
vpc_cidr = "10.2.0.0/16"
public_subnet_cidrs = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
database_subnet_cidrs = ["10.2.20.0/24", "10.2.21.0/24", "10.2.22.0/24"]

# Database Configuration
postgres_instance_class = "db.r5.large"
postgres_allocated_storage = 500
postgres_max_allocated_storage = 2000
postgres_backup_retention_period = 35
postgres_skip_final_snapshot = false
postgres_deletion_protection = true
postgres_maintenance_window = "sun:03:00-sun:04:00"
postgres_backup_window = "03:00-04:00"
postgres_storage_encrypted = true
postgres_performance_insights_enabled = true
postgres_monitoring_interval = 60
postgres_enable_cloudwatch_logs_exports = ["postgresql", "upgrade"]

# Redis Configuration
redis_node_type = "cache.r6.large"
redis_num_cache_nodes = 3
redis_automatic_failover_enabled = true
redis_multi_az_enabled = true
redis_at_rest_encryption_enabled = true
redis_transit_encryption_enabled = true
redis_auth_token = "your-redis-auth-token"
redis_maintenance_window = "sun:05:00-sun:06:00"

# S3 Buckets
s3_buckets = {
  "advancia-prod-logs" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 30
      storage_class = "STANDARD_IA"
      transition_days_2 = 60
      storage_class_2 = "GLACIER"
      transition_days_3 = 90
      storage_class_3 = "DEEP_ARCHIVE"
      expiration_days = 2555
    }
    encryption = "AES256"
    access_logging = true
  }
  "advancia-prod-backups" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 30
      storage_class = "STANDARD_IA"
      transition_days_2 = 90
      storage_class_2 = "GLACIER"
      transition_days_3 = 365
      storage_class_3 = "DEEP_ARCHIVE"
      expiration_days = 3650
    }
    encryption = "AES256"
    replication = true
    replication_region = "us-west-2"
  }
  "advancia-prod-static" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 60
      storage_class = "STANDARD_IA"
    }
    encryption = "AES256"
    access_logging = true
  }
  "advancia-prod-artifacts" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 30
      storage_class = "STANDARD_IA"
    }
    encryption = "AES256"
    access_logging = true
  }
  "advancia-prod-patient-data" = {
    versioning = true
    lifecycle_rule = {
      enabled = true
      transition_days = 365
      storage_class = "GLACIER"
      expiration_days = 3650
    }
    encryption = "AES256"
    access_logging = true
    replication = true
    replication_region = "us-west-2"
    hipaa_compliance = true
  }
}

# Security Configuration
enable_security_hub = true
enable_guardduty = true
enable_macie = true
enable_config_rules = true
enable_cloudtrail = true
enable_vpc_flow_logs = true
enable_aws_config_recorder = true
enable_iam_access_analyzer = true
enable_certificate_transparency_logging = true

# Monitoring Configuration
enable_cloudwatch_alarms = true
enable_sns_notifications = true
log_retention_days = 365
metric_retention_days = 455
enable_detailed_monitoring = true
enable_xray = true

# Cost Optimization
enable_cost_allocation_tags = true
enable_budget_alerts = true
monthly_budget_limit = 10000
budget_threshold = 75
budget_threshold_2 = 90

# Networking Configuration
enable_nat_gateway = true
enable_dns_hostnames = true
enable_dns_support = true
enable_flow_log_encryption = true
enable_private_link = true

# Certificate Configuration
certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/prod-cert-id"

# Route53 Configuration
route53_zone_id = "Z1EXAMPLEPROD"
domain_name = "advancia.com"
enable_health_checks = true

# Application Load Balancer Configuration
alb_ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"
enable_alb_logging = true
alb_log_bucket = "advancia-prod-logs"
enable_waf = true
waf_web_acl_arn = "arn:aws:waf::ACCOUNT:webacl/prod-wacl"

# Auto Scaling Configuration
enable_cluster_autoscaler = true
scale_down_delay_after_add = "5m"
scale_down_unneeded_time = "15m"
scale_down_utilization_threshold = 0.3

# Backup Configuration
enable_cross_region_backup = true
backup_region = "us-west-2"
backup_retention_period = 90
enable_point_in_time_recovery = true

# HIPAA Compliance Configuration
hipaa_compliance_enabled = true
enable_kms_encryption = true
kms_key_rotation_enabled = true
enable_cloudtrail_log_validation = true
enable_s3_server_access_logging = true

# Disaster Recovery Configuration
enable_multi_az = true
enable_cross_zone_load_balancing = true
enable_read_replica = true
read_replica_region = "us-west-2"

# Performance Configuration
enable_cdn = true
cdn_distribution_id = "E1234567890ABC"
enable_compression = true
enable_http2 = true

# Advanced Security
enable_ddos_protection = true
shield_advanced_enabled = true
enable_shield_advanced = true
enable_macie_s3_data_identification = true

# Compliance
enable_audit_logging = true
enable_config_aggregation = true
enable_control_tower = true
enable_security_hub_standards = ["CIS AWS Foundations Benchmark", "PCI DSS", "HIPAA Security"]

# Tags
tags = {
  Environment = "production"
  Project = "advancia"
  Owner = "ops-team"
  ManagedBy = "terraform"
  CostCenter = "engineering"
  DataClassification = "phi"
  Compliance = "hipaa"
  Backup = "daily"
  Monitoring = "enabled"
  Security = "high"
}
