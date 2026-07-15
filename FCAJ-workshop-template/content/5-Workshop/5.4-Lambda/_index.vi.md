---
title: "5.4 Deploy Backend"
date: 2026-07-10
weight: 4
chapter: false
---

## 5.4 Biên dịch & Deploy C# Backend lên AWS Lambda

Quy trình biên dịch mã nguồn C# để chạy trên hệ điều hành Linux 64-bit của môi trường AWS Lambda không máy chủ.

### 1. Các lệnh đóng gói ứng dụng (Packaging)
Do AWS Lambda chạy trên nền tảng Linux, ta cần biên dịch mã nguồn C# thành mã nhị phân độc lập chạy trực tiếp trên kiến trúc `linux-x64`.

Mở cửa sổ PowerShell tại thư mục chứa dự án Backend và chạy các lệnh sau:
```powershell
# Bước A: Xóa thư mục biên dịch cũ nếu có để tránh lẫn lộn file cũ
Remove-Item -Path "publish" -Recurse -Force -ErrorAction SilentlyContinue

# Bước B: Thực hiện biên dịch tối ưu hóa Release cho kiến trúc Linux 64-bit
dotnet publish -c Release -r linux-x64 --self-contained true -o publish /p:GenerateRuntimeConfigurationFiles=true

# Bước C: Đổi tên file chạy chính của API từ "SmartDorm.Api" thành "bootstrap"
# Điều này vô cùng quan trọng đối với môi trường Custom Runtime của AWS Lambda
Rename-Item -Path "publish/SmartDorm.Api" -NewName "bootstrap"

# Bước D: Nén toàn bộ tệp tin trong thư mục publish thành file backend.zip
Compress-Archive -Path "publish/*" -DestinationPath "../backend.zip" -Force
```

### 2. Định nghĩa Hàm Lambda Serverless trong Terraform
Khai báo Hàm AWS Lambda tự động kéo mã nguồn `backend.zip` từ local lên đám mây và kết kết nối với database RDS:
```hcl
# 1. ĐƯA FILE COMPRESS LÊN BUCKET TẠM THỜI
resource "aws_s3_bucket" "lambda_deploy_bucket" {
  bucket_prefix = "smartdorm-lambda-deploy-"
  force_destroy = true
}

resource "aws_s3_object" "lambda_code" {
  bucket = aws_s3_bucket.lambda_deploy_bucket.id
  key    = "backend.zip"
  source = "../backend.zip" # Đường dẫn tới file zip vừa nén
}

# 2. KHỞI TẠO CẤU HÌNH HÀM LAMBDA
resource "aws_lambda_function" "backend_api" {
  function_name    = "SmartDormBackendAPI"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "bootstrap"
  runtime          = "provided.al2" # Custom runtime chạy trên Amazon Linux 2
  s3_bucket        = aws_s3_bucket.lambda_deploy_bucket.id
  s3_key           = aws_s3_object.lambda_code.key
  timeout          = 30
  memory_size      = 256 # RAM 256MB giúp xử lý truy vấn dữ liệu nhanh gọn

  environment {
    variables = {
      # Cấu hình biến môi trường kết nối Database động dựa trên RDS Endpoint vừa tạo
      "ConnectionStrings__DefaultConnection" = "Host=${aws_db_instance.smartdorm_db.endpoint};Database=smartdorm;Username=postgres;Password=${var.db_password}"
    }
  }
}
```
