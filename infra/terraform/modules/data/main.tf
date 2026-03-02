terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_security_group" "data" {
  name        = "${var.name}-data-sg"
  description = "Data plane access"
  vpc_id      = var.vpc_id

  tags = var.tags
}

resource "aws_security_group_rule" "data_ingress" {
  for_each = {
    postgres   = 5432
    redis      = 6379
    opensearch = 9200
  }

  type                     = "ingress"
  from_port                = each.value
  to_port                  = each.value
  protocol                 = "tcp"
  security_group_id        = aws_security_group.data.id
  source_security_group_id = var.app_security_group_id
}

resource "aws_security_group_rule" "data_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.data.id
}

resource "aws_db_subnet_group" "postgres" {
  name       = "${var.name}-db-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

resource "aws_db_instance" "postgres" {
  identifier              = "${var.name}-postgres"
  engine                  = "postgres"
  engine_version          = var.postgres_engine_version
  instance_class          = var.postgres_instance_class
  allocated_storage       = var.postgres_allocated_storage
  username                = var.postgres_username
  password                = var.postgres_password
  db_subnet_group_name    = aws_db_subnet_group.postgres.name
  vpc_security_group_ids  = [aws_security_group.data.id]
  multi_az                = var.postgres_multi_az
  backup_retention_period = var.postgres_backup_retention_days
  skip_final_snapshot     = true

  tags = var.tags
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.name}-redis-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.name}-redis"
  description                   = "AutoQual Redis"
  engine                        = "redis"
  node_type                     = var.redis_node_type
  num_cache_clusters            = var.redis_node_count
  port                          = 6379
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [aws_security_group.data.id]
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  auth_token                    = var.redis_auth_token

  tags = var.tags
}

resource "aws_opensearch_domain" "search" {
  domain_name    = "${var.name}-search"
  engine_version = var.opensearch_engine_version

  cluster_config {
    instance_type  = var.opensearch_instance_type
    instance_count = var.opensearch_instance_count
  }

  vpc_options {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.data.id]
  }

  advanced_security_options {
    enabled                        = true
    internal_user_database_enabled = true

    master_user_options {
      master_user_name     = var.opensearch_master_username
      master_user_password = var.opensearch_master_password
    }
  }

  tags = var.tags
}

resource "aws_s3_bucket" "raw_media" {
  bucket = var.raw_media_bucket
  tags   = var.tags
}

resource "aws_s3_bucket" "derived_media" {
  bucket = var.derived_media_bucket
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "raw_media" {
  bucket = aws_s3_bucket.raw_media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "derived_media" {
  bucket = aws_s3_bucket.derived_media.id
  versioning_configuration {
    status = "Enabled"
  }
}
