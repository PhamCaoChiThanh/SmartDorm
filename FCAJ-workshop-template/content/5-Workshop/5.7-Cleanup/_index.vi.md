---
title: "5.7 Dọn dẹp hạ tầng"
date: 2026-07-10
weight: 7
chapter: false
---

## 5.7 Dọn dẹp tài nguyên hạ tầng để tránh phát sinh chi phí

Sau khi đã demo hoàn thành bài thực hành hoặc khi đợt thực tập kết thúc, bạn nên thực hiện thu hồi tài nguyên đám mây để tránh phát sinh hóa đơn tính tiền ngầm của AWS.

### Chạy lệnh hủy toàn bộ tài nguyên qua Terraform
Tại thư mục chứa các file mã nguồn Terraform của bạn trên Command Prompt/PowerShell, thực thi lệnh sau:
```bash
terraform destroy -var="db_password=Chithanh123plus" -auto-approve
```

#### Tiến trình hủy tài nguyên mong đợi:
1.  Hủy các định tuyến mạng Route Table và Internet Gateway.
2.  Thu hồi máy chủ RDS PostgreSQL Database (Quá trình này có thể kéo dài 3 - 5 phút).
3.  Xóa các hàm AWS Lambda, S3 Bucket deploy và API Gateway endpoints.
4.  Màn hình hiển thị thông báo thành công:
    ```text
    Destroy complete! Resources: 18 destroyed.
    ```

> [!WARNING]
> Lệnh `terraform destroy` sẽ xóa vĩnh viễn toàn bộ bảng cơ sở dữ liệu trên cloud. Hãy thực hiện xuất dữ liệu (Database backup) trước khi chạy lệnh này nếu cần thiết.
