terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  tags = {
    app = "autoqual"
    env = var.env_name
  }
}

module "network" {
  source          = "../../modules/network"
  name            = var.env_name
  vpc_cidr        = var.vpc_cidr
  azs             = var.azs
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
  tags            = local.tags
}

module "eks" {
  source              = "../../modules/eks"
  cluster_name        = "${var.env_name}-autoqual"
  cluster_version     = var.eks_version
  vpc_id              = module.network.vpc_id
  private_subnet_ids  = module.network.private_subnet_ids
  node_instance_types = var.node_instance_types
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  node_desired_size   = var.node_desired_size
  tags                = local.tags
}

module "data" {
  source                          = "../../modules/data"
  name                            = var.env_name
  vpc_id                          = module.network.vpc_id
  private_subnet_ids              = module.network.private_subnet_ids
  app_security_group_id           = module.eks.cluster_security_group_id
  postgres_engine_version         = var.postgres_engine_version
  postgres_instance_class         = var.postgres_instance_class
  postgres_allocated_storage      = var.postgres_allocated_storage
  postgres_username               = var.postgres_username
  postgres_password               = var.postgres_password
  postgres_multi_az               = var.postgres_multi_az
  postgres_backup_retention_days  = var.postgres_backup_retention_days
  redis_node_type                 = var.redis_node_type
  redis_node_count                = var.redis_node_count
  redis_auth_token                = var.redis_auth_token
  opensearch_engine_version       = var.opensearch_engine_version
  opensearch_instance_type        = var.opensearch_instance_type
  opensearch_instance_count       = var.opensearch_instance_count
  opensearch_master_username      = var.opensearch_master_username
  opensearch_master_password      = var.opensearch_master_password
  raw_media_bucket                = var.raw_media_bucket
  derived_media_bucket            = var.derived_media_bucket
  tags                            = local.tags
}

module "secrets" {
  source               = "../../modules/secrets"
  name                 = var.env_name
  database_secret_json = var.database_secret_json
  app_secret_json      = var.app_secret_json
  tags                 = local.tags
}

module "observability" {
  source             = "../../modules/observability"
  name               = var.env_name
  log_retention_days = var.log_retention_days
  tags               = local.tags
}

module "edge" {
  source              = "../../modules/edge"
  name                = var.env_name
  domain_name         = var.domain_name
  hosted_zone_id      = var.hosted_zone_id
  origin_domain_name  = var.origin_domain_name
  acm_certificate_arn = var.acm_certificate_arn
  tags                = local.tags
}
