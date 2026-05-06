# 🚀 Secure SmartDorm - Hệ thống Quản lý KTX Cloud-Native & Bảo mật Cao

[![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Security](https://img.shields.io/badge/Security-Protected-green?style=for-the-badge&logo=shield-halved)](https://owasp.org/)

## 💡 Ý tưởng Dự án
**Secure SmartDorm** là phiên bản nâng cao của hệ thống quản lý Ký túc xá (KTX), được thiết kế theo mô hình **Fullstack Cloud-Native**. Dự án tập trung vào việc tối ưu hóa hiệu năng, khả năng mở rộng và đặc biệt là áp dụng các tiêu chuẩn bảo mật chuẩn doanh nghiệp trên nền tảng AWS.

Dây không chỉ là một ứng dụng quản lý thông thường, mà là một hệ thống "Real System" giải quyết các bài toán về hạ tầng và an toàn thông tin thực tế.

---

## 🏗️ Kiến trúc Hệ thống (Architecture)
Hệ thống được triển khai hoàn toàn trên hạ tầng AWS nhằm đảm bảo tính sẵn sàng cao (High Availability) và bảo mật tối đa:

- **Frontend Hosting:** [Amazon S3](https://aws.amazon.com/s3/) kết hợp với [Amazon CloudFront](https://aws.amazon.com/cloudfront/) (CDN) để tăng tốc độ tải trang và bảo mật lớp biên.
- **API Layer:** [Amazon API Gateway](https://aws.amazon.com/api-gateway/) đóng vai trò là cửa ngõ duy nhất cho các yêu cầu từ client.
- **Compute (Serverless):** [AWS Lambda](https://aws.amazon.com/lambda/) xử lý logic backend, giúp tối ưu chi phí và tự động mở rộng.
- **Database:** [Amazon RDS](https://aws.amazon.com/rds/) (Relational Database Service) lưu trữ dữ liệu tập trung và tin cậy.
- **Authentication:** [Amazon Cognito](https://aws.amazon.com/cognito/) quản lý người dùng, đăng ký/đăng nhập và phân quyền.

---

## 🧱 Stack Công nghệ
| Thành phần | Công nghệ sử dụng |
| :--- | :--- |
| **Frontend** | ReactJS / Next.js |
| **Cloud Hosting** | S3 + CloudFront |
| **Backend** | AWS Lambda (Node.js/Python/C#) |
| **API Management** | Amazon API Gateway |
| **Database** | Amazon RDS (PostgreSQL/MySQL) |
| **Identity Management** | Amazon Cognito |

---

## 🛡️ Bảo mật (Security First)
Đây là điểm mạnh nhất của dự án, giúp ứng dụng đạt chuẩn Cloud Security:

*   **Xác thực & Phân quyền:** Sử dụng **JWT (JSON Web Token)** kết hợp với **RBAC (Role-Based Access Control)** để quản lý quyền truy cập chi tiết (Admin, Quản lý, Sinh viên).
*   **Bảo vệ lớp biên:** Triển khai **AWS WAF (Web Application Firewall)** để chống lại các cuộc tấn công phổ biến như SQL Injection (SQLi) và Cross-Site Scripting (XSS).
*   **Bảo mật hạ tầng:** Cơ sở dữ liệu (RDS) được đặt trong **Private Subnet**, chỉ cho phép truy cập từ nội bộ hệ thống (Lambda), ngăn chặn hoàn toàn truy cập trái phép từ internet.
*   **Giám sát & Nhật ký:** Toàn bộ hoạt động của hệ thống được ghi log chi tiết qua **Amazon CloudWatch**, giúp phát hiện sớm các hành vi bất thường và hỗ trợ debug.

---

## ⭐ Tại sao dự án này có "CV cực mạnh"?
Dự án thể hiện tư duy của một kỹ sư không chỉ biết code mà còn biết thiết kế hệ thống chuyên nghiệp:
1.  **Real System:** Áp dụng kiến trúc Serverless hiện đại, tối ưu hóa vận hành.
2.  **Cloud Native:** Thành thạo các dịch vụ cốt lõi của AWS.
3.  **Security Mindset:** Hiểu và thực hành các tiêu chuẩn bảo mật OWASP và Cloud Infrastructure Security.
4.  **Scalability:** Hệ thống sẵn sàng phục vụ hàng ngàn người dùng mà không cần thay đổi kiến trúc cốt lõi.

---

## 🚀 Hướng dẫn Cài đặt & Triển khai
*(Đang cập nhật...)*

---
**Secure SmartDorm** - *Build for Security, Scale for Future.*