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

# Custom VPC for SmartDorm
resource "aws_vpc" "smartdorm_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "smartdorm-vpc"
  }
}

resource "aws_internet_gateway" "smartdorm_igw" {
  vpc_id = aws_vpc.smartdorm_vpc.id
  tags = {
    Name = "smartdorm-igw"
  }
}

resource "aws_subnet" "smartdorm_subnet_a" {
  vpc_id                  = aws_vpc.smartdorm_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = {
    Name = "smartdorm-subnet-a"
  }
}

resource "aws_subnet" "smartdorm_subnet_b" {
  vpc_id                  = aws_vpc.smartdorm_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags = {
    Name = "smartdorm-subnet-b"
  }
}

resource "aws_route_table" "smartdorm_rt" {
  vpc_id = aws_vpc.smartdorm_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.smartdorm_igw.id
  }
  tags = {
    Name = "smartdorm-rt"
  }
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.smartdorm_subnet_a.id
  route_table_id = aws_route_table.smartdorm_rt.id
}

resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.smartdorm_subnet_b.id
  route_table_id = aws_route_table.smartdorm_rt.id
}

resource "aws_db_subnet_group" "smartdorm_db_subnet_group" {
  name       = "smartdorm-db-subnet-group"
  subnet_ids = [aws_subnet.smartdorm_subnet_a.id, aws_subnet.smartdorm_subnet_b.id]
  tags = {
    Name = "smartdorm-db-subnet-group"
  }
}

# Tạo Security Group mở cổng 5432 cho phép bạn truy cập từ máy tính (Local)
resource "aws_security_group" "rds_sg" {
  name        = "smartdorm_rds_sg"
  description = "Cho phep truy cap PostgreSQL"
  vpc_id      = aws_vpc.smartdorm_vpc.id

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
  identifier             = "smartdorm-postgres-db"
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "postgres"
  engine_version         = "15" # Cho phép AWS tự chọn minor version khả dụng nhất
  instance_class         = "db.t4g.micro" # Free tier eligible
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.postgres15"
  skip_final_snapshot    = true
  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.smartdorm_db_subnet_group.name

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

# Bucket để lưu file zip deploy Lambda
resource "aws_s3_bucket" "lambda_deploy_bucket" {
  bucket_prefix = "smartdorm-lambda-deploy-"
  force_destroy = true
}

resource "aws_s3_object" "lambda_code" {
  bucket      = aws_s3_bucket.lambda_deploy_bucket.id
  key         = "backend.zip"
  source      = "../backend.zip"
  source_hash = filebase64sha256("../backend.zip")
}

# Hàm Lambda chính
resource "aws_lambda_function" "backend_api" {
  function_name    = "SmartDormBackendAPI"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "bootstrap"
  runtime          = "provided.al2023"
  s3_bucket        = aws_s3_bucket.lambda_deploy_bucket.id
  s3_key           = aws_s3_object.lambda_code.key
  source_code_hash = filebase64sha256("../backend.zip")

  timeout     = 30
  memory_size = 512

  environment {
    variables = {
      ConnectionStrings__DefaultConnection = "Host=${aws_db_instance.smartdorm_db.address};Database=smartdorm;Username=${aws_db_instance.smartdorm_db.username};Password=${var.db_password};Port=5432"
      Jwt__Secret                          = var.jwt_secret
      AWS__Region                          = var.aws_region
      AWS__BucketName                      = aws_s3_bucket.frontend_bucket.id
      DOTNET_SYSTEM_GLOBALIZATION_INVARIANT = "true"
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
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["date", "keep-alive", "content-type", "authorization"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}

resource "aws_lambda_permission" "allow_public_function_url" {
  statement_id           = "AllowActiveFunctionURL"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.backend_api.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

# ==========================================
# 3.5. API EXPOSURE ALTERNATIVE: API GATEWAY (Bypass Function URL Public Blocks)
# ==========================================

resource "aws_apigatewayv2_api" "http_api" {
  name          = "smartdorm-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["date", "keep-alive", "content-type", "authorization"]
    max_age       = 86400
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.backend_api.arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend_api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# ==========================================
# 4. FRONTEND STATIC HOSTING: AMAZON S3
# ==========================================

resource "aws_s3_bucket" "frontend_bucket" {
  bucket_prefix = "smartdorm-frontend-hosting-"
  force_destroy = true
}

resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket     = aws_s3_bucket.frontend_bucket.id
  depends_on = [aws_s3_bucket_public_access_block.frontend_public_access]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "smartdorm_lambda_s3_policy"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject"
        ]
        Resource = [
          "${aws_s3_bucket.frontend_bucket.arn}/*"
        ]
      }
    ]
  })
}

# ==========================================
# OUTPUTS
# ==========================================

output "lambda_api_url" {
  description = "URL chính thức của Backend (Frontend gọi vào đây)"
  value       = aws_lambda_function_url.api_endpoint.function_url
}

output "api_gateway_url" {
  description = "URL cổng API Gateway (Giải pháp thay thế để tránh lỗi Forbidden của Function URL)"
  value       = aws_apigatewayv2_stage.default_stage.invoke_url
}

output "rds_endpoint" {
  description = "Endpoint kết nối Database RDS"
  value       = aws_db_instance.smartdorm_db.address
}

output "frontend_website_url" {
  description = "URL của trang web Frontend tĩnh trên S3"
  value       = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
}
