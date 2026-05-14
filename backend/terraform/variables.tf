variable "aws_region" {
  description = "Region triển khai (Khuyên dùng ap-southeast-1 cho VN)"
  type        = string
  default     = "ap-southeast-1"
}

variable "db_username" {
  description = "Username đăng nhập vào RDS"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Mật khẩu RDS (Cần phải phức tạp, vd: MySecurePassword123!)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Khóa bí mật để tạo JWT Token"
  type        = string
  sensitive   = true
}
