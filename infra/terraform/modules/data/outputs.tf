output "postgres_endpoint" {
  value = aws_db_instance.postgres.address
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "opensearch_endpoint" {
  value = aws_opensearch_domain.search.endpoint
}

output "raw_media_bucket" {
  value = aws_s3_bucket.raw_media.bucket
}

output "derived_media_bucket" {
  value = aws_s3_bucket.derived_media.bucket
}

output "data_security_group_id" {
  value = aws_security_group.data.id
}
