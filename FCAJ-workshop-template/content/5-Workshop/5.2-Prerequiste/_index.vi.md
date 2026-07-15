---
title: "5.2 Yêu cầu chuẩn bị"
date: 2026-07-10
weight: 2
chapter: false
---

## 5.2 Yêu cầu chuẩn bị

Để hoàn thành bài Lab này, máy tính cá nhân của bạn cần chuẩn bị sẵn các công cụ phần mềm sau:

### 1. Tài khoản AWS (AWS Account)
*   Đăng ký tài khoản mới tại: [https://aws.amazon.com/](https://aws.amazon.com/) để nhận gói Free Tier 12 tháng.

### 2. Cài đặt các công cụ CLI
*   **AWS CLI v2:** Dùng để quản trị tài nguyên AWS qua dòng lệnh.
    *   Tải về tại: [AWS CLI Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
    *   Sau khi cài đặt, chạy lệnh `aws configure` và nhập Access Key/Secret Key từ tài khoản AWS IAM của bạn.
*   **Terraform CLI (phiên bản >= 1.5.0):** Công cụ quản lý hạ tầng dưới dạng mã.
    *   Tải về tại: [Terraform Install](https://developer.hashicorp.com/terraform/downloads)

### 3. Môi trường phát triển ứng dụng
*   **C# .NET 10/8 SDK:** Dùng để biên dịch mã nguồn Backend.
*   **NodeJS (phiên bản >= 18.0.0):** Để chạy và đóng gói Next.js Frontend.
*   **Docker Desktop:** Cần thiết nếu bạn muốn giả lập database PostgreSQL ở môi trường local trước khi đẩy lên AWS RDS.
