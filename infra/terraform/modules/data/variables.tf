variable "name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "app_security_group_id" {
  type = string
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
  type = string
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

variable "tags" {
  type    = map(string)
  default = {}
}
