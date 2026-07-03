# 🚀 Secure SmartDorm - Hệ thống Quản lý KTX Cloud-Native Tối ưu Chi phí & Tích hợp AI

[![C# Backend](<https://img.shields.io/badge/C%23-ASP.NET%20Core%20%2F%20.NET%2010-blue.svg?style=for-the-badge&logo=dotnet>)](https://dotnet.microsoft.com/)
[![React Frontend](<https://img.shields.io/badge/React-Next.js%2016-black.svg?style=for-the-badge&logo=react>)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![AWS Integration](<https://img.shields.io/badge/AWS-S3%20%26%20Bedrock%20%26%20Lambda-FF9900.svg?style=for-the-badge&logo=amazon-aws>)](https://aws.amazon.com/)

**Secure SmartDorm** là hệ thống quản lý Ký túc xá toàn diện được thiết kế theo mô hình **Fullstack Cloud-Native Tối ưu**. Hệ thống cung cấp các nghiệp vụ quản lý phòng, điện nước, hợp đồng, xe cộ, bảng tin nội bộ, tích hợp trợ lý AI thông minh để nhắc nợ tự động, đi kèm cơ chế bảo mật phiên làm việc và tối ưu hóa tài nguyên.

---

## 💡 Các Tính Năng Nổi Bật Mới Cập Nhật

### 1. 🤖 Nhắc Nợ Tự Động Bằng Trí Tuệ Nhân Tạo (AI Debt Reminder)

- **Công nghệ**: Tích hợp dịch vụ **Amazon Bedrock** (`IBedrockService`) để xử lý ngôn ngữ tự nhiên.
- **Nghiệp vụ**: Tự động phân tích các hóa đơn chưa thanh toán của sinh viên, đánh giá mức độ trễ hạn và hành vi thanh toán trước đó để sinh ra email nhắc nợ cá nhân hóa với văn phong phù hợp (từ nhắc nhở thân thiện đến thông cáo nghiêm khắc).
- **Mã nguồn**: [InvoiceController.cs](file:///m:/SmartDorm/backend/Controllers/InvoiceController.cs) và giao diện trực quan tại trang quản trị hóa đơn admin.

### 2. 📸 Tải Ảnh Đại Diện Local Tốc Độ Cao (Avatar Upload)

- **Công nghệ**: Phục vụ file tĩnh trực tiếp trên Web Server C# thông qua cấu hình `PhysicalFileProvider` tại [Program.cs](file:///m:/SmartDorm/backend/Program.cs).
- **Tính năng**: Cho phép sinh viên đăng tải ảnh đại diện với mọi loại kích thước (vượt qua giới hạn size thông thường thông qua thuộc tính `[DisableRequestSizeLimit]`), tự động lưu trữ cục bộ tại thư mục `/wwwroot/uploads` của backend và liên kết trực tiếp vào cơ sở dữ liệu PostgreSQL.

### 3. 🔒 Bảo Mật Phiên Làm Việc Nghiêm Ngặt (Session Security)

- **Công nghệ**: Chuyển đổi toàn bộ cơ chế lưu trữ phiên xác thực JWT từ `localStorage` sang **`sessionStorage`** trên toàn bộ 15 tệp giao diện.
- **Hiệu quả**: Đảm bảo trạng thái đăng nhập bị hủy bỏ lập tức ngay khi người dùng tắt tab hoặc đóng trình duyệt. Lần truy cập tiếp theo bắt buộc phải nhập lại thông tin tài khoản, tránh rò rỉ session trên các thiết bị dùng chung.

---

## 🏗️ Kiến Trúc Công Nghệ (Technology Stack)

Hệ thống được phát triển chuyên nghiệp với sự phân tách rõ ràng giữa các lớp:

* **Backend (C#):** Web API được xây dựng trên nền tảng **ASP.NET Core / .NET 10.0** cực kỳ mạnh mẽ, sử dụng Entity Framework Core để quản lý và tương tác dữ liệu. Tích hợp sẵn AWS SDK cho S3 và Bedrock.
* **Frontend (JavaScript/TypeScript):** Ứng dụng client-side hiện đại sử dụng **React 19** và framework **Next.js 16 (Turbopack)** cho hiệu năng tải trang và trải nghiệm người dùng tối ưu.
* **Database:** Hệ quản trị cơ sở dữ liệu quan hệ **PostgreSQL**, quản lý dữ liệu lịch sử hóa đơn, người dùng, xe cộ, yêu cầu bảo trì và các bảng tin giao tiếp nội bộ (`posts`, `comments`, `notifications`).

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
SmartDorm/
├── backend/                   # C# Backend Web API (NET 10)
│   ├── Controllers/           # Các bộ điều khiển API (Auth, Invoice, Tenant, Request...)
│   ├── Data/                  # Lớp kết nối dữ liệu (AppDbContext.cs)
│   ├── Models/                # Định nghĩa các thực thể C# (Models.cs)
│   ├── Services/              # Các dịch vụ nghiệp vụ (Ocr, Email, Pdf, Bedrock...)
│   ├── Properties/            # Cấu hình khởi chạy (launchSettings.json)
│   ├── wwwroot/               # Thư mục lưu trữ file tĩnh cục bộ (uploads/)
│   └── appsettings.json       # Cấu hình môi trường chạy
├── frontend/                  # React / Next.js Frontend (Next 16)
│   ├── app/                   # Next.js Pages & Layouts (admin, tenant, login...)
│   ├── components/            # Các component dùng chung (ThemeToggle, Modals...)
│   ├── lib/                   # API utilities & helper functions (api.ts)
│   └── public/                # Assets tĩnh của frontend
└── database.sql               # File schema khởi tạo toàn bộ cấu trúc bảng PostgreSQL
```

---

## 🚀 Hướng Dẫn Khởi Chạy Môi Trường Local

### Yêu Cầu Cài Đặt Sẵn:

- **.NET SDK 10.0**
- **Node.js (phiên bản 18+)**
- **PostgreSQL (phiên bản 14+)**

### 1. Khởi tạo Cơ sở dữ liệu

1. Đăng nhập vào PostgreSQL và tạo một database mới tên là `smartdorm`.
2. Khởi chạy toàn bộ cấu trúc bảng bằng cách chạy file SQL:
   ```bash
   psql -U postgres -d smartdorm -f database.sql
   ```

### 2. Cấu hình & Khởi chạy Backend C#

1. Mở tệp [appsettings.Development.json](file:///m:/SmartDorm/backend/appsettings.Development.json) và điều chỉnh connection string của bạn:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Database=smartdorm;Username=postgres;Password=YOUR_DB_PASSWORD;Port=5432"
   }
   ```
2. Cấu hình SMTP Email và AWS Credentials trong [appsettings.json](file:///m:/SmartDorm/backend/appsettings.json) để sử dụng các tính năng thông báo và AI Bedrock.
3. Di chuyển vào thư mục backend và chạy lệnh:
   ```bash
   cd backend
   dotnet run
   ```

   *Lưu ý: API sẽ lắng nghe tại cổng `http://localhost:3001`.*

### 3. Cấu hình & Khởi chạy Frontend Next.js

1. Cấu hình API URL trong tệp `.env` ở thư mục frontend (hoặc mặc định ứng dụng sẽ tự trỏ đến `http://localhost:3001/api`).
2. Di chuyển vào thư mục frontend, cài đặt dependency và chạy:
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
