output "cdn_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "waf_arn" {
  value = aws_wafv2_web_acl.edge.arn
}
