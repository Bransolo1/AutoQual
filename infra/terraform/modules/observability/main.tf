terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_prometheus_workspace" "this" {
  alias = "${var.name}-amp"
  tags  = var.tags
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/autoqual/${var.name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}
