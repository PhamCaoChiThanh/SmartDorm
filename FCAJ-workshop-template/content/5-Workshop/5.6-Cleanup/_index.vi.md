---
title: "5.6 Dọn dẹp tài nguyên"
date: 2026-07-10
weight: 6
chapter: false
---
## 5.6 Dọn dẹp tài nguyên để tránh phát sinh chi phí

Để tránh việc tài nguyên tiếp tục chạy ngầm trên Cloud sinh chi phí sau khi kết thúc buổi thực hành báo cáo, hãy thực hiện dọn dẹp hạ tầng sạch sẽ.

### Lệnh xóa toàn bộ hạ tầng qua Terraform

Tại thư mục chứa các file cấu hình Terraform (`terraform/`), mở terminal lên và chạy câu lệnh duy nhất sau:

```bash
terraform destroy -var="db_password=Chithanh123plus" -auto-approve
```

#### Kết quả mong đợi sau khi chạy lệnh:

* Màn hình terminal hiển thị tiến trình hủy bỏ các tài nguyên mạng VPC, máy chủ RDS PostgreSQL, Hàm Lambda và API Gateway.
* Thông báo thành công cuối cùng dạng:
  ```text
  Destroy complete! Resources: 18 destroyed.
  ```

> [!WARNING]
> Việc chạy lệnh `terraform destroy` sẽ xóa hoàn toàn cơ sở dữ liệu trên Cloud. Bạn hãy sao lưu các bảng dữ liệu cần thiết trước khi thực thi lệnh này.
