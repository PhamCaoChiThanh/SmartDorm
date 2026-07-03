# 🚀 Secure SmartDorm - Hệ thống Quản lý KTX Cloud-Native Tối ưu Chi phí & Tích hợp AI

[![C# Backend](https://img.shields.io/badge/C%23-ASP.NET%20Core%20%2F%20.NET%2010-blue.svg?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com/)
[![React Frontend](https://img.shields.io/badge/React-Next.js%2016-black.svg?style=for-the-badge&logo=react)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![AWS Integration](https://img.shields.io/badge/AWS-S3%20%26%20Bedrock%20%26%20Lambda-FF9900.svg?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/)

**Secure SmartDorm** là hệ thống quản lý Ký túc xá toàn diện được thiết kế theo mô hình **Fullstack Cloud-Native Tối ưu**. Hệ thống cung cấp các nghiệp vụ quản lý phòng, điện nước, hợp đồng, xe cộ, bảng tin nội bộ, tích hợp trợ lý AI thông minh để nhắc nợ tự động, đi kèm cơ chế bảo mật phiên làm việc và tối ưu hạ tầng.

---

## 💡 Ý tưởng Dự án & Kiến trúc Tối ưu (Architecture)

Dự án tập trung vào việc cân bằng giữa hiệu năng cao và chi phí vận hành thấp nhất bằng cách tận dụng triệt để mô hình **Serverless** và gói **AWS Free Tier** để đưa chi phí duy trì cố định về mức gần bằng $0.

Hệ thống sử dụng 3 dịch vụ cốt lõi của AWS (The Big Three) để vận hành:
- **Compute & API Layer (AWS Lambda):** Sử dụng C# Web API deploy lên AWS Lambda kết hợp với **Function URLs** để cung cấp public Endpoint cho Backend với chi phí $0 (1 triệu requests/tháng miễn phí).
- **Database Layer (Amazon RDS PostgreSQL):** Sử dụng cơ sở dữ liệu PostgreSQL chạy trên RDS gói `db.t4g.micro` để tận dụng chương trình miễn phí, đảm bảo lưu trữ dữ liệu tin cậy.
- **Storage & Frontend Hosting (Amazon S3):** Chứa file tĩnh frontend (React/Next.js Static Hosting) và lưu trữ tệp tài sản (ảnh xe, ảnh phòng, hóa đơn).

---

## 🧱 Stack Công nghệ & Chi phí (The Big Three)

| Thành phần | Công nghệ ứng dụng | Chi phí (Free Tier) |
| :--- | :--- | :--- |
| **Logic phía máy chủ** | AWS Lambda (C# Web API / .NET 10) | $0 (1M requests/tháng) |
| **Cơ sở dữ liệu** | Amazon RDS (PostgreSQL) | $0 (750 giờ/tháng) |
| **Giao diện & Tài sản** | Amazon S3 | ~0,1 đô la (Chỉ phí lưu trữ) |

---

## 💡 Các Tính Năng Nổi Bật Mới Cập Nhật

### 1. 🤖 Nhắc Nợ Tự Động Bằng Trí Tuệ Nhân Tạo (AI Debt Reminder)
- **Công nghệ**: Tích hợp dịch vụ **Amazon Bedrock** (`IBedrockService`) để xử lý ngôn ngữ tự nhiên.
- **Nghiệp vụ**: Tự động phân tích các hóa đơn chưa thanh toán của sinh viên, đánh giá mức độ trễ hạn để sinh ra email nhắc nợ cá nhân hóa với văn phong phù hợp (từ nhắc nhở thân thiện đến thông cáo nghiêm khắc).
- **Mã nguồn**: [InvoiceController.cs](file:///m:/SmartDorm/backend/Controllers/InvoiceController.cs) và giao diện trực quan tại trang quản trị hóa đơn admin.

### 2. 📸 Tải Ảnh Đại Diện Local & Tối ưu Kích thước (Avatar Upload)
- **Cấu hình**: Phục vụ file tĩnh trực tiếp trên Web Server C# thông qua `PhysicalFileProvider` tại [Program.cs](file:///m:/SmartDorm/backend/Program.cs).
- **Tính năng**: Cho phép tải lên ảnh đại diện ở mọi kích thước nhờ thuộc tính `[DisableRequestSizeLimit]`, tự động lưu trữ cục bộ tại `/wwwroot/uploads` của backend và lưu đường dẫn vào DB PostgreSQL.

### 3. 🔒 Bảo Mật Phiên Làm Việc (Session Security)
- **Công nghệ**: Thay thế việc lưu trữ Token, User, Email từ `localStorage` sang **`sessionStorage`** trên toàn bộ 15 tệp giao diện.
- **Hiệu quả**: Đảm bảo trạng thái đăng nhập bị hủy bỏ lập tức ngay khi người dùng tắt tab hoặc đóng trình duyệt, ngăn ngừa rò rỉ thông tin trên thiết bị công cộng.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
SmartDorm/
├── backend/                   # C# Backend Web API (NET 10)
│   ├── Controllers/           # Các bộ điều khiển API (Auth, Invoice, Tenant, Request...)
│   ├── Data/                  # Lớp kết nối dữ liệu (AppDbContext.cs)
│   ├── Models/                # Định nghĩa các thực thể C# (Models.cs)
│   ├── Services/              # Các dịch vụ nghiệp vụ (Ocr, Email, Pdf, Bedrock...)
│   ├── wwwroot/               # Thư mục lưu trữ file tĩnh cục bộ (uploads/)
│   └── appsettings.json       # Cấu hình môi trường chạy
├── frontend/                  # React / Next.js Frontend (Next 16)
│   ├── app/                   # Next.js Pages & Layouts (admin, tenant, login...)
│   ├── components/            # Các component dùng chung (ThemeToggle, Modals...)
│   ├── lib/                   # API utilities & helper functions (api.ts)
│   └── public/                # Assets tĩnh của frontend
└── database.sql               # File schema khởi tạo cấu trúc bảng PostgreSQL
```

---

## 🚀 Hướng Dẫn Khởi Chạy Môi Trường Local

### Yêu Cầu Cài Đặt Sẵn:
- **.NET SDK 10.0**
- **Node.js (phiên bản 18+)**
- **PostgreSQL (phiên bản 14+)**

### 1. Khởi tạo Cơ sở dữ liệu
1. Tạo một database mới trong PostgreSQL tên là `smartdorm`.
2. Khởi chạy toàn bộ cấu trúc bảng bằng cách chạy file SQL:
   ```bash
   psql -U postgres -d smartdorm -f database.sql
   ```

### 2. Khởi chạy Backend C#
1. Mở tệp [appsettings.Development.json](file:///m:/SmartDorm/backend/appsettings.Development.json) và điều chỉnh connection string:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Database=smartdorm;Username=postgres;Password=YOUR_DB_PASSWORD;Port=5432"
   }
   ```
2. Di chuyển vào thư mục backend và chạy lệnh:
   ```bash
   cd backend
   dotnet run
   ```
   *Lưu ý: API local sẽ lắng nghe tại cổng `http://localhost:3001`.*

### 3. Khởi chạy Frontend Next.js
1. Di chuyển vào thư mục frontend, cài đặt dependency và chạy:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Lưu ý: Giao diện người dùng sẽ chạy tại địa chỉ `http://localhost:3000`.*

---

## 🔑 Tài Khoản Thử Nghiệm Mặc Định
- **Quản trị viên (ADMIN)**:
  - Tên đăng nhập: `admin`
  - Mật khẩu: `123456`
- **Sinh viên (TENANT)**: Người dùng tự đăng ký tài khoản trực tiếp trên giao diện hệ thống.

---
**Secure SmartDorm** - *Hiệu năng đỉnh cao, Chi phí tối ưu, Trải nghiệm an toàn.*
