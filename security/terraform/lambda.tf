# IAM Role và Policies (Giữ nguyên như cũ)
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# --- Lambda cho Main Backend (Auth, Rooms, Tenants...) ---
resource "aws_lambda_function" "main_backend" {
  function_name = "${var.project_name}-main-backend"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "src/app.handler" # Giả định bạn dùng serverless-http
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 512

  filename      = "${path.module}/placeholder.zip"

  environment {
    variables = {
      DB_HOST     = aws_db_instance.postgres.address
      DB_PORT     = "5432"
      DB_NAME     = var.db_name
      DB_USER     = var.db_username
      DB_PASSWORD = var.db_password
      JWT_SECRET  = "your-secret-key" # Nên dùng AWS Secrets Manager nếu cần bảo mật cao hơn
      S3_BUCKET   = aws_s3_bucket.assets.id
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}

resource "aws_lambda_function_url" "main_backend_url" {
  function_name      = aws_lambda_function.main_backend.function_name
  authorization_type = "NONE"
}

# --- Lambda cho Vehicles Module (Giữ lại nếu bạn muốn tách module) ---
resource "aws_lambda_function" "vehicles_module" {
  function_name = "${var.project_name}-vehicles-module"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"

  filename      = "${path.module}/placeholder.zip"
  
  environment {
    variables = {
      DB_HOST     = aws_db_instance.postgres.address
      DB_PORT     = "5432"
      DB_NAME     = var.db_name
      DB_USER     = var.db_username
      DB_PASSWORD = var.db_password
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}

resource "aws_lambda_function_url" "vehicles_url" {
  function_name      = aws_lambda_function.vehicles_module.function_name
  authorization_type = "NONE"
}
