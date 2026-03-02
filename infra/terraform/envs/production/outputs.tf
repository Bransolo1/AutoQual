output "cluster_name" {
  value = module.eks.cluster_name
}

output "postgres_endpoint" {
  value = module.data.postgres_endpoint
}

output "redis_endpoint" {
  value = module.data.redis_endpoint
}

output "opensearch_endpoint" {
  value = module.data.opensearch_endpoint
}

output "cdn_domain_name" {
  value = module.edge.cdn_domain_name
}

output "prometheus_workspace_id" {
  value = module.observability.prometheus_workspace_id
}
