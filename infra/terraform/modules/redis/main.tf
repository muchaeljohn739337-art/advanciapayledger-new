terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "random_password" "redis_auth_token" {
  length           = 64
  special          = false
  override_special = ""
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.name}-redis-"
  description = "Security group for Redis ElastiCache"
  vpc_id      = var.vpc_id

  ingress {
    description = "Redis from VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = var.vpc_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name}-redis"
  })
}

resource "aws_subnet_group" "redis" {
  name       = "${var.name}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name}-redis-subnet-group"
  })
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.name}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name}-redis-subnet-group"
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = var.name
  description                = "Redis cluster for ${var.name}"
  
  node_type                  = var.node_type
  port                       = 6379
  parameter_group_name       = var.parameter_group_name
  
  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled
  
  auth_token                 = var.auth_token != null ? var.auth_token : random_password.redis_auth_token.result
  
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  
  subnet_group_name         = aws_elasticache_subnet_group.redis.name
  security_group_ids        = [aws_security_group.redis.id]
  
  snapshot_retention_limit  = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window
  maintenance_window       = var.maintenance_window
  
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }
  
  tags = merge(var.tags, {
    Name = var.name
  })
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/redis/${var.name}"
  retention_in_days = var.log_retention_days
  
  tags = merge(var.tags, {
    Name = "${var.name}-redis-logs"
  })
}

resource "aws_secretsmanager_secret" "redis" {
  name = "${var.name}-redis"
  
  description = "Redis credentials for ${var.name}"
  
  tags = merge(var.tags, {
    Name = "${var.name}-redis"
  })
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  
  secret_string = jsonencode({
    host     = aws_elasticache_replication_group.redis.primary_endpoint_address
    port     = aws_elasticache_replication_group.redis.port
    password = var.auth_token != null ? var.auth_token : random_password.redis_auth_token.result
    url      = "redis://:${var.auth_token != null ? var.auth_token : random_password.redis_auth_token.result}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:${aws_elasticache_replication_group.redis.port}"
  })
}
