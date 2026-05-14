# 🚀 Secure SmartDorm - Hệ thống Quản lý KTX Cloud-Native Tối ưu Chi phí

[![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Cost-Optimized](https://img.shields.io/badge/Cost-Optimized-blue?style=for-the-badge&logo=cash-register)](https://aws.amazon.com/free/)

## 💡 Ý tưởng Dự án

**Secure SmartDorm** là hệ thống quản lý Ký túc xá được thiết kế theo mô hình **Fullstack Cloud-Native Tối ưu**. Dự án tập trung vào việc cân bằng giữa hiệu năng cao và chi phí vận hành thấp nhất có thể bằng cách tận dụng triệt để mô hình **Serverless** và gói **AWS Free Tier**.
Đây là minh chứng cho việc xây dựng một hệ thống quy mô lớn nhưng chỉ tốn phí duy trì gần như bằng 0.

---

## 🏗️ Kiến trúc Hệ thống Tối ưu (Architecture)

Hệ thống được rút gọn vào 3 dịch vụ cốt lõi của AWS để tối ưu chi phí và đơn giản hóa vận hành:

- **Compute & API Layer:** [AWS Lambda](https://aws.amazon.com/lambda/) kết hợp với **Function URLs**. Thay vì dùng API Gateway đắt đỏ, hệ thống sử dụng trực tiếp Function URLs để cung cấp Endpoint cho Backend với chi phí $0.
- **Database Layer:** [Amazon RDS](https://aws.random.com/rds/) (PostgreSQL). Sử dụng gói `db.t4g.micro` để tận dụng 12 tháng miễn phí, đảm bảo lưu trữ dữ liệu an toàn và tin cậy.
- **Storage & Frontend Hosting:** [Amazon S3](https://aws.amazon.com/s3/). Đóng vai trò kép: Hosting cho ứng dụng React/Next.js (Static Website Hosting) và lưu trữ ảnh (CCCD, phòng, xe).

---

## 🧱 Stack Công nghệ (The Big Three)

| Thành phần | Công nghệ sử dụng | Chi phí (Free Tier) |
| :--- | :--- | :--- |
| **Backend Logic** | AWS Lambda (Node.js/C#) | $0 (1M requests/mo) |
| **Database** | Amazon RDS (PostgreSQL) | $0 (750 hrs/mo) |
| **Frontend & Assets** | Amazon S3 | ~$0.1 (Storage only) |

---

## 🛡️ Chiến lược Bảo mật & Tối ưu (Security & Cost)

Mặc dù tối giản về dịch vụ, dự án vẫn áp dụng các tiêu chuẩn bảo mật nghiêm ngặt:

* **Auth tự quản lý:** Sử dụng **JWT (JSON Web Token)** tích hợp trực tiếp trong Backend Lambda thay vì dùng Cognito, giúp giảm phụ thuộc và tối ưu tốc độ.
* **White-listing Database:** RDS được cấu hình Publicly Accessible nhưng **chỉ chấp nhận kết nối từ Security Group của Lambda**, ngăn chặn hoàn toàn các truy cập từ bên ngoài internet.
* **Zero Infrastructure Fee:** Loại bỏ NAT Gateway ($32/tháng) bằng cách tối ưu hóa Routing, đưa chi phí vận hành cố định về mức $0.
* **Monitoring:** Sử dụng **Amazon CloudWatch** để theo dõi lỗi và tình trạng hệ thống theo thời gian thực.

---

## ⭐ Tại sao dự án này có "CV cực mạnh"?

Dự án thể hiện tư duy thực tế của một kỹ sư Cloud:

1. **Cost Efficiency:** Biết cách thiết kế hệ thống chạy ổn định với chi phí thấp nhất (Skill tối quan trọng cho doanh nghiệp).
2. **Serverless Mastery:** Thành thạo kiến trúc Event-driven và Lambda Function URLs.
3. **Fullstack Ownership:** Tự quản lý từ hạ tầng (Terraform), Database đến Frontend/Backend.
4. **Database Design:** Thiết kế chuẩn hóa dữ liệu cho một bài toán thực tế (Quản lý phòng, xe, điện nước).

---

## 📂 Cấu trúc Thư mục (Project Structure)

```text
.
├── .github/workflows/   # CI/CD pipelines (GitHub Actions)
├── terraform/           # Hạ tầng mã hóa (IaC) cho AWS
│   ├── main.tf          # Cấu hình chính
│   ├── rds.tf           # PostgreSQL setup
│   ├── lambda.tf        # Lambda & IAM Roles
│   ├── s3.tf            # Hosting & Assets
│   └── monitoring.tf    # CloudWatch Logs & Alarms
├── src/
│   ├── backend/         # Logic xử lý (Lambda)
│   │   └── modules/
│   │       └── vehicles/# Module Quản lý Xe & Gửi xe
│   └── frontend/        # React/Next.js source
├── .env.example         # Template biến môi trường
└── database.sql         # Schema khởi tạo DB
```

---

## 🚀 Hướng dẫn Cài đặt & Triển khai

### 1. Triển khai Hạ tầng (Terraform)
1. Cài đặt Terraform và AWS CLI.
2. Di chuyển vào thư mục `terraform/`.
3. Chạy lệnh:
   ```bash
   terraform init
   terraform apply -var="db_password=YOUR_PASSWORD"
   ```

### 2. Cấu hình Biến môi trường
Copy `.env.example` thành `.env` và cập nhật các thông số từ Output của Terraform (RDS Endpoint, Lambda URL).

### 3. CI/CD (GitHub Actions)
Thiết lập các **Secrets** trong GitHub Repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DB_PASSWORD`

Hệ thống sẽ tự động Deploy mỗi khi bạn push code lên nhánh `main`.

---

**Secure SmartDorm** - *Maximum Performance, Minimum Cost.*
