variable "env_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "azs" {
  type = list(string)
}

variable "public_subnets" {
  type = list(string)
}

variable "private_subnets" {
  type = list(string)
}

variable "eks_version" {
  type = string
}

variable "node_instance_types" {
  type = list(string)
}

variable "node_min_size" {
  type = number
}

variable "node_max_size" {
  type = number
}

variable "node_desired_size" {
  type = number
}

variable "postgres_engine_version" {
  type = string
}

variable "postgres_instance_class" {
  type = string
}

variable "postgres_allocated_storage" {
  type = number
}

variable "postgres_username" {
  type = string
}

variable "postgres_password" {
  type      = string
  sensitive = true
}

variable "postgres_multi_az" {
  type = bool
}

variable "postgres_backup_retention_days" {
  type = number
}

variable "redis_node_type" {
  type = string
}

variable "redis_node_count" {
  type = number
}

variable "redis_auth_token" {
  type      = string
  sensitive = true
}

variable "opensearch_engine_version" {
  type = string
}

variable "opensearch_instance_type" {
  type = string
}

variable "opensearch_instance_count" {
  type = number
}

variable "opensearch_master_username" {
  type = string
}

variable "opensearch_master_password" {
  type      = string
  sensitive = true
}

variable "raw_media_bucket" {
  type = string
}

variable "derived_media_bucket" {
  type = string
}

variable "database_secret_json" {
  type      = string
  sensitive = true
}

variable "app_secret_json" {
  type      = string
  sensitive = true
}

variable "log_retention_days" {
  type = number
}

variable "domain_name" {
  type = string
}

variable "hosted_zone_id" {
  type = string
}

variable "origin_domain_name" {
  type = string
}

variable "acm_certificate_arn" {
  type = string
}
