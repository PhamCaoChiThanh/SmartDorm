# 🚀 Secure SmartDorm - Hệ thống Quản lý KTX Cloud-Native Tối ưu Chi phí & Tích hợp AI

[![C# Backend](https://img.shields.io/badge/C%23-ASP.NET%20Core%20%2F%20.NET%2010-blue.svg?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com/)
[![React Frontend](https://img.shields.io/badge/React-Next.js%2016-black.svg?style=for-the-badge&logo=react)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![AWS Integration](https://img.shields.io/badge/AWS-S3%20%26%20Bedrock%20%26%20Lambda-FF9900.svg?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

**Secure SmartDorm** là giải pháp quản lý Ký túc xá (KTX) toàn diện, được thiết kế theo mô hình **Fullstack Cloud-Native**. Dự án hướng đến việc cân bằng hoàn hảo giữa hiệu năng hệ thống vượt trội, trải nghiệm người dùng hiện đại và chi phí vận hành hạ tầng đám mây tối ưu (xấp xỉ $0 cố định nhờ tận dụng triệt để mô hình Serverless và gói AWS Free Tier).

---

## 💡 Ý tưởng Dự án & Kiến trúc Tối ưu (Architecture)

SmartDorm được xây dựng nhằm giảm thiểu tối đa chi phí duy trì cố định cho các ban quản lý KTX quy mô nhỏ và vừa. Kiến trúc Serverless của hệ thống bao gồm:

*   **Compute & API Layer (AWS Lambda):** Sử dụng C# Web API deploy lên AWS Lambda kết hợp với **Function URLs**. Giải pháp này loại bỏ chi phí cố định của API Gateway, cung cấp public Endpoint cho Backend hoàn toàn miễn phí dưới 1 triệu requests/tháng.
*   **Database Layer (Amazon RDS PostgreSQL):** Sử dụng hệ quản trị cơ sở dữ liệu PostgreSQL chạy trên gói RDS `db.t4g.micro` miễn phí (750 giờ/tháng).
*   **Storage & Hosting (Amazon S3):** Lưu trữ mã nguồn tĩnh Frontend (Next.js Static Export) và làm kho chứa tệp tin tải lên (ảnh đại diện, hóa đơn, thông tin phương tiện).

---

## 🧱 Stack Công nghệ & Chi phí (The Big Three)

| Thành phần | Công nghệ ứng dụng | Chi phí ước tính (AWS Free Tier) |
| :--- | :--- | :--- |
| **Logic phía máy chủ** | AWS Lambda (ASP.NET Core / .NET 10) | $0 (1M requests/tháng free) |
| **Cơ sở dữ liệu** | Amazon RDS (PostgreSQL 14+) | $0 (750 giờ/tháng free) |
| **Giao diện & Tài sản** | Amazon S3 & CloudFront | ~$0.1 (Chỉ tính dung lượng lưu trữ thực tế) |

---

## 🌟 Các Tính Năng Nổi Bật

### 1. 🤖 Nhắc Nợ Tự Động Bằng AI (AI Debt Reminder)
*   **Chi tiết:** Tích hợp dịch vụ **Amazon Bedrock** thông qua giao diện `IBedrockService`.
*   **Cách thức:** Hệ thống tự động quét các hóa đơn điện nước/phòng trễ hạn, gửi thông tin phân tích cho AI để tạo nội dung email nhắc nợ tự động được cá nhân hóa sâu sắc theo mức độ trễ hạn (nhắc nhở nhẹ nhàng đối với trễ hạn ngắn ngày và thông cáo nghiêm khắc đối với quá hạn lâu).

### 2. 📸 Tải Ảnh Đại Diện Local & Tối ưu Kích thước
*   Phục vụ file tĩnh trực tiếp trên Web Server thông qua `PhysicalFileProvider` tại [Program.cs](file:///m:/SmartDorm/backend/Program.cs).
*   Cho phép tải lên tệp tin lớn không giới hạn kích thước nhờ bộ lọc `[DisableRequestSizeLimit]` tại [UploadController.cs](file:///m:/SmartDorm/backend/Controllers/UploadController.cs), lưu trữ cục bộ tại thư mục `/wwwroot/uploads` hoặc đồng bộ lên Amazon S3 Cloud.

### 3. 🔒 Bảo Mật Cách Ly Phiên Làm Việc (Session Isolation)
*   Thay thế lưu trữ thông tin xác thực từ `localStorage` sang **`sessionStorage`** tại tất cả các trang giao diện.
*   Tránh tối đa việc rò rỉ JWT Token hoặc thông tin cá nhân của sinh viên khi sử dụng máy tính công cộng (thư viện, phòng máy trường học) nhờ cơ chế tự động hủy bỏ phiên ngay khi đóng tab trình duyệt.

### 4. 🚗 Phân Hệ Quản Lý Xe & Vé Gửi Xe (Vehicles & Parking)
*   Quản lý thông tin chi tiết phương tiện của sinh viên (Biển số xe, dòng xe, phân loại xe đạp/xe máy/ô tô).
*   Hệ thống đăng ký vé gửi xe định kỳ (Vé tháng/Vé ngày) và tự động tạo hóa đơn gửi xe hàng tháng riêng biệt.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
SmartDorm/
├── backend/                   # Backend Web API (C# .NET 10)
│   ├── Controllers/           # Các bộ điều khiển API chính (Auth, Invoice, Request, Upload...)
│   ├── Data/                  # Lớp kết nối database (AppDbContext.cs)
│   ├── Models/                # Định nghĩa các thực thể C# (Models.cs)
│   ├── Services/              # Dịch vụ nghiệp vụ (AI Bedrock, Email, PDF, OCR...)
│   ├── wwwroot/               # Thư mục lưu trữ file tĩnh cục bộ (uploads/)
│   └── appsettings.json       # Cấu hình kết nối và môi trường
├── frontend/                  # React / Next.js Frontend (Next 16)
│   ├── app/                   # Next.js Pages & Layouts (admin, tenant, login...)
│   ├── components/            # Các component dùng chung (ThemeToggle, Modals...)
│   ├── lib/                   # Chức năng gọi API Client (api.ts)
│   └── public/                # Hình ảnh và assets tĩnh của frontend
├── terraform/                 # Cấu hình Infrastructure as Code (IaC) để deploy lên AWS
└── database.sql               # File schema khởi tạo toàn bộ bảng database PostgreSQL
```

---

## 🚀 Hướng Dẫn Khởi Chạy Môi Trường Local

### Yêu Cầu Cài Đặt Sẵn:
*   **.NET SDK 10.0**
*   **Node.js (Phiên bản 18+)**
*   **PostgreSQL (Phiên bản 14+)**

### Bước 1: Thiết lập Cơ sở dữ liệu
1.  Tạo một database mới trong PostgreSQL tên là `smartdorm`.
2.  Chạy tập lệnh SQL khởi tạo cấu trúc bảng:
    ```bash
    psql -U postgres -d smartdorm -f database.sql
    ```

### Bước 2: Chạy Backend C# Web API
1.  Mở tệp [appsettings.Development.json](file:///m:/SmartDorm/backend/appsettings.Development.json) và cập nhật thông tin kết nối DB của bạn:
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "Host=localhost;Database=smartdorm;Username=postgres;Password=YOUR_DB_PASSWORD;Port=5432"
    }
    ```
2.  Di chuyển vào thư mục backend và khởi chạy dự án:
    ```bash
    cd backend
    dotnet run
    ```
    *Lưu ý: API sẽ lắng nghe tại cổng mặc định `http://localhost:3001`.*

### Bước 3: Chạy Frontend Next.js
1.  Di chuyển vào thư mục frontend, cài đặt các thư viện phụ thuộc và chạy môi trường dev:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *Lưu ý: Giao diện web chạy tại địa chỉ `http://localhost:3000`.*

---


## 📄 Giấy phép (License)

Dự án này được phân phối dưới giấy phép **ISC License**. Xem chi tiết tại tệp tin [LICENSE](file:///m:/SmartDorm/LICENSE).
