output "prometheus_workspace_id" {
  value = aws_prometheus_workspace.this.id
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.app.name
}
