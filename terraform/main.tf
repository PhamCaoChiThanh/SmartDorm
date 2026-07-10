terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ==========================================
# 1. DATABASE LAYER: AMAZON RDS (POSTGRESQL)
# ==========================================

# Lấy thông tin Default VPC
data "aws_vpc" "default" {
  default = true
}

# Tạo Security Group mở cổng 5432 cho phép bạn truy cập từ máy tính (Local)
resource "aws_security_group" "rds_sg" {
  name        = "smartdorm_rds_sg"
  description = "Cho phep truy cap PostgreSQL"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "smartdorm_db" {
  identifier           = "smartdorm-postgres-db"
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15" # Cho phép AWS tự chọn minor version khả dụng nhất
  instance_class       = "db.t4g.micro" # Free tier eligible
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  skip_final_snapshot    = true
  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  # Chú ý: Ở môi trường thực tế, nên dùng VPC/Security Group cụ thể
  # Đây là cấu hình nhanh để Lambda và bạn có thể truy cập
}

# ==========================================
# 2. COMPUTE LAYER: AWS LAMBDA
# ==========================================

# IAM Role cho Lambda
resource "aws_iam_role" "lambda_exec_role" {
  name = "smartdorm_lambda_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Đính kèm quyền ghi log (CloudWatch)
resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Hàm Lambda chính
resource "aws_lambda_function" "backend_api" {
  function_name    = "SmartDormBackendAPI"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "src/app.handler" # Trỏ đến export.handler trong app.js
  runtime          = "nodejs20.x"
  filename         = "../backend.zip"
  source_code_hash = filebase64sha256("../backend.zip")

  timeout     = 10
  memory_size = 256

  environment {
    variables = {
      DB_HOST     = aws_db_instance.smartdorm_db.address
      DB_USER     = aws_db_instance.smartdorm_db.username
      DB_PASSWORD = var.db_password
      DB_NAME     = aws_db_instance.smartdorm_db.db_name
      DB_PORT     = "5432"
      JWT_SECRET  = var.jwt_secret
    }
  }
}

# ==========================================
# 3. API EXPOSURE: FUNCTION URL
# ==========================================

resource "aws_lambda_function_url" "api_endpoint" {
  function_name      = aws_lambda_function.backend_api.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["date", "keep-alive", "content-type", "authorization"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}

# ==========================================
# OUTPUTS
# ==========================================

output "lambda_api_url" {
  description = "URL chính thức của Backend (Frontend gọi vào đây)"
  value       = aws_lambda_function_url.api_endpoint.function_url
}

output "rds_endpoint" {
  description = "Endpoint kết nối Database RDS"
  value       = aws_db_instance.smartdorm_db.address
}
