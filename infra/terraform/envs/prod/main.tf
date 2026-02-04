terraform {
  backend "s3" {
    bucket         = "advancia-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "advancia-terraform-locks"
  }
  
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
  
  default_tags {
    tags = merge(var.tags, {
      Environment = "production"
      ManagedBy   = "terraform"
    })
  }
}

data "aws_vpc" "main" {
  id = var.vpc_id
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }
  
  filter {
    name   = "tag:Name"
    values = ["*private*"]
  }
}

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

module "k8s_cluster" {
  source = "../../modules/k8s-cluster"
  
  cluster_name = var.cluster_name
  region       = var.region
  vpc_id       = var.vpc_id
  subnet_ids   = data.aws_subnets.private.ids
  
  tags = var.tags
}

module "postgres" {
  source = "../../modules/postgres"
  
  name                 = "advancia-postgres-prod"
  region               = var.region
  vpc_id               = var.vpc_id
  subnet_ids           = data.aws_subnets.private.ids
  vpc_cidr_blocks      = [data.aws_vpc.main.cidr_block]
  
  instance_class              = "db.r6g.2xlarge"
  allocated_storage           = 500
  max_allocated_storage        = 2000
  backup_retention_period     = 30
  performance_insights_enabled = true
  monitoring_interval         = 60
  create_read_replica         = true
  
  tags = var.tags
}

module "redis" {
  source = "../../modules/redis"
  
  name         = "advancia-redis-prod"
  region       = var.region
  vpc_id       = var.vpc_id
  subnet_ids   = data.aws_subnets.private.ids
  vpc_cidr_blocks = [data.aws_vpc.main.cidr_block]
  
  node_type                    = "cache.r6g.large"
  num_cache_clusters           = 3
  automatic_failover_enabled   = true
  multi_az_enabled             = true
  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  snapshot_retention_limit     = 30
  
  tags = var.tags
}

module "ingress" {
  source = "../../modules/ingress"
  
  cluster_name       = var.cluster_name
  region             = var.region
  domain_name        = var.domain_name
  route53_zone_id    = data.aws_route53_zone.main.zone_id
  letsencrypt_email  = var.letsencrypt_email
  oidc_provider_arn  = module.k8s_cluster.oidc_provider_arn
  oidc_provider_url  = module.k8s_cluster.cluster_oidc_provider_url
  
  tags = var.tags
}

module "monitoring" {
  source = "../../modules/monitoring"
  
  cluster_name            = var.cluster_name
  region                  = var.region
  storage_class_name      = "gp3"
  grafana_admin_password  = var.grafana_admin_password
  smtp_host              = var.smtp_host
  smtp_from              = var.smtp_from
  default_email          = var.default_email
  critical_email         = var.critical_email
  warning_email          = var.warning_email
  
  tags = var.tags
}
