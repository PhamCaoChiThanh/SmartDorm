---
title: "5.1 Tổng quan dự án"
date: 2026-07-10
weight: 1
chapter: false
---

## 5.1 Tổng quan dự án & Sơ đồ kiến trúc

### 1. Bối cảnh bài toán thực tế
Trong quản lý kí túc xá và phòng trọ lớn, các hệ thống luôn phải trực tuyến 24/7 để tiếp nhận yêu cầu đặt phòng của sinh viên, báo hỏng thiết bị, hoặc phục vụ việc đối soát hóa đơn điện nước và thanh toán. 
Tuy nhiên, lượng truy cập vào ban đêm và các khung giờ học tập thường cực kỳ thấp. Việc duy trì máy chủ truyền thống chạy liên tục gây ra sự lãng phí rất lớn về mặt ngân sách (ước tính khoảng $15 - $40/tháng đối với các máy chủ cấu hình trung bình).

Dự án **SmartDorm** giải quyết triệt để bài toán này bằng cách áp dụng mô hình điện toán không máy chủ (**Serverless**) trên nền tảng AWS, giúp chi phí vận hành giảm về mức **gần như 0 USD/tháng** ở quy mô chạy thử nghiệm.

### 2. Sơ đồ kiến trúc chi tiết (Architecture Diagram)
Dưới đây là sơ đồ luồng dữ liệu và thiết kế phân vùng mạng an toàn của hệ thống:

```text
+-------------------------------------------------------------------------------+
|                             AWS CLOUD (Region: ap-southeast-1)                |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   | VPC (Mạng ảo độc lập - CIDR: 10.0.0.0/16)                             |   |
|   |                                                                       |   |
|   |  +-----------------------------------------------------------------+  |   |
|   |  | Subnet A (Mạng công khai - Public Subnet - CIDR: 10.0.1.0/24)   |  |   |
|   |  |                                                                 |  |   |
|   |  |  [API Gateway] (HTTP API Proxy v2)                              |  |   |
|   |  |        |                                                        |  |   |
|   |  |        v (Chuyển tiếp API Request)                              |  |   |
|   |  |  [AWS Lambda] (Backend Serverless C# .NET 10)                 |  |   |
|   |  |        | (Truy cập bằng Security Group cổng 5432)               |  |   |
|   |  +--------|--------------------------------------------------------+  |   |
|   |           |                                                           |   |
|   |  +--------v--------------------------------------------------------+  |   |
|   |  | Subnet B (Mạng nội bộ - Private Subnet - CIDR: 10.0.2.0/24)     |  |   |
|   |  |                                                                 |  |   |
|   |  |  [Amazon RDS PostgreSQL] (db.t4g.micro - Graviton2 ARM)         |  |   |
|   |  +-----------------------------------------------------------------+  |   |
|   +-----------------------------------------------------------------------+   |
|                                                                               |
|   +-----------------------+               +-------------------------------+   |
|   | Amazon S3 (Bucket)    |               | Vercel Cloud Hosting          |   |
|   | (Lưu trữ ảnh & CCCD)  |               | (Lưu trữ Static Frontend)     |   |
|   +-----------------------+               +-------------------------------+   |
+-------------------------------------------------------------------------------+
```

### 3. Nguyên lý hoạt động của các dịch vụ sử dụng:
*   **Vercel Hosting:** Nơi lưu trữ mã nguồn Next.js tĩnh. Tự động cấp phát HTTPS và kết nối an toàn với máy chủ API.
*   **AWS API Gateway (HTTP API):** Hoạt động như một chốt chặn tiếp nhận và kiểm tra định tuyến request. Lợi ích: Tốc độ phản hồi cực nhanh, rẻ hơn 70% so với REST API.
*   **AWS Lambda:** Đóng vai trò là máy chủ tính toán Serverless. Khi có request gọi API, Lambda sẽ khởi tạo một container siêu nhỏ (MicroVM) chạy mã nguồn C#, thực thi xong và tự giải phóng bộ nhớ ngay lập tức. Bạn chỉ trả tiền cho thời gian chạy thực tế tính bằng mili-giây.
*   **Amazon S3:** Do Lambda hoạt động trên phân vùng đĩa chỉ đọc, toàn bộ dữ liệu ảnh tải lên của sinh viên sẽ được đẩy thẳng lên S3 Bucket công khai và lưu trữ vĩnh viễn với giá chỉ vài cents/GB.
*   **Amazon RDS (PostgreSQL):** Máy chủ database được cài đặt trong Subnet Private cô lập hoàn toàn khỏi internet. Chỉ có Lambda nằm trong cùng mạng VPC và cấu hình đúng cổng Security Group mới có thể đọc ghi dữ liệu.

### 4. Chi tiết luồng xử lý dữ liệu (Data Request Flow)
Dựa theo các vòng tròn ký hiệu số (1, 2, 3, 4) trên sơ đồ thiết kế kiến trúc hệ thống:
*   **Luồng 1 (Người dùng -> Frontend):** Người dùng (Tenant/Admin) truy cập trang web thông qua trình duyệt web. Trình duyệt gửi yêu cầu tải trang Next.js Frontend.
*   **Luồng 2 (Frontend -> S3 Hosting):** Next.js Frontend được tải từ S3 Frontend Hosting (hoặc Vercel) để hiển thị giao diện động trên trình duyệt của người dùng.
*   **Luồng 3 (Frontend -> Lambda Backend):** Khi người dùng thao tác (như gửi đơn thuê phòng, đăng nhập, hoặc chốt chỉ số điện nước), Frontend gọi các API HTTPS thông qua AWS API Gateway. API Gateway định tuyến và kích hoạt trực tiếp hàm AWS Lambda chạy backend C# hoặc Node.js tùy thuộc loại tác vụ.
*   **Luồng 4 (Lambda -> Database & S3 Storage):** Lambda Backend tiếp nhận request, kết nối an toàn vào mạng Private Subnet để truy vấn và cập nhật dữ liệu trong database Amazon RDS PostgreSQL. Đối với tác vụ gửi ảnh (ảnh chân dung hoặc ảnh CCCD), Lambda Backend sẽ tải trực tiếp luồng tệp tin (File Stream) lên Amazon S3 Media Storage để lưu trữ vĩnh viễn, sau đó trả link ảnh về cho Client hiển thị.
