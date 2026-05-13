output "vehicles_api_url" {
  description = "URL của API Quản lý Xe"
  value       = aws_lambda_function_url.vehicles_url.function_url
}

output "rds_endpoint" {
  description = "Địa chỉ kết nối Database"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_hosting_url" {
  description = "URL trang web Frontend (S3)"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}
