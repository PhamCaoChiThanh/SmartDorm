---
title: "5.4 Deploy Backend API"
date: 2026-07-10
weight: 4
chapter: false
---

## 5.4 Compiling & Deploying C# Backend to AWS Lambda

This page details the compilation commands and AWS serverless resources setup.

### 1. Terminal packaging Commands
Because AWS Lambda runs on Linux virtualization runtimes, compile your C# codes targeting `linux-x64`.

Open your PowerShell terminal inside the `backend/` folder and execute the commands below:
```powershell
# Step A: Clean previous build folders
Remove-Item -Path "publish" -Recurse -Force -ErrorAction SilentlyContinue

# Step B: Compile optimized Release binary files targeting Linux platforms
dotnet publish -c Release -r linux-x64 --self-contained true -o publish /p:GenerateRuntimeConfigurationFiles=true

# Step C: Rename main application binary from "SmartDorm.Api" to "bootstrap"
# Required for AWS Lambda custom runtimes to recognize entrypoint handler
Rename-Item -Path "publish/SmartDorm.Api" -NewName "bootstrap"

# Step D: Compress publish contents into backend.zip package
Compress-Archive -Path "publish/*" -DestinationPath "../backend.zip" -Force
```

### 2. Defining Lambda resources in Terraform
Configure the Lambda resources to automatically receive and parse deployment archives:
```hcl
# 1. PROVISION BUCKET FOR ARCHIVE UPLOAD
resource "aws_s3_bucket" "lambda_deploy_bucket" {
  bucket_prefix = "smartdorm-lambda-deploy-"
  force_destroy = true
}

resource "aws_s3_object" "lambda_code" {
  bucket = aws_s3_bucket.lambda_deploy_bucket.id
  key    = "backend.zip"
  source = "../backend.zip"
}

# 2. CREATE LAMBDA ENGINE FUNCTION
resource "aws_lambda_function" "backend_api" {
  function_name    = "SmartDormBackendAPI"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "bootstrap"
  runtime          = "provided.al2" # Amazon Linux 2 Custom runtime
  s3_bucket        = aws_s3_bucket.lambda_deploy_bucket.id
  s3_key           = aws_s3_object.lambda_code.key
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      # Inject connection strings referencing database endpoint properties
      "ConnectionStrings__DefaultConnection" = "Host=${aws_db_instance.smartdorm_db.endpoint};Database=smartdorm;Username=postgres;Password=${var.db_password}"
    }
  }
}
```
