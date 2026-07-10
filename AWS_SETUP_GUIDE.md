# Hướng dẫn Cấu hình AWS để sử dụng Terraform

Để công cụ **Terraform** có quyền tạo Database (RDS) và Backend (Lambda) trên tài khoản AWS của bạn một cách tự động, bạn cần cấu hình khóa bảo mật (Access Keys). 

Làm theo các bước sau một cách cẩn thận:

## Bước 1: Lấy thông tin Credentials từ AWS Console
1. Truy cập vào trang web [AWS Management Console](https://console.aws.amazon.com/) và đăng nhập vào tài khoản của bạn.
2. Nhấp vào tên tài khoản của bạn ở góc trên bên phải màn hình và chọn **Security Credentials**.
3. Cuộn xuống phần **Access keys**, nhấp vào nút **Create access key**.
4. Chọn **Command Line Interface (CLI)**, tích vào ô xác nhận, sau đó bấm Next -> Create access key.
5. AWS sẽ cung cấp cho bạn 2 thông tin vô cùng quan trọng:
   - **Access key ID** (Ví dụ: `AKIAIOSFODNN7EXAMPLE`)
   - **Secret access key** (Ví dụ: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
   
> [!WARNING]
> Tuyệt đối không chia sẻ `Secret access key` cho bất kỳ ai hoặc đẩy (push) lên GitHub. Đây là chìa khóa có toàn quyền trên tài khoản của bạn. Nếu lỡ làm lộ, hãy xóa ngay lập tức trên AWS Console và tạo key mới.

## Bước 2: Cài đặt AWS CLI (Giao diện dòng lệnh của AWS)
Nếu máy bạn chưa có phần mềm AWS CLI, hãy mở Terminal (hoặc PowerShell) với quyền Administrator và chạy lệnh:
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```
Sau khi cài xong, bạn đóng Terminal rồi mở lại Terminal mới để nhận lệnh `aws`.

## Bước 3: Cấu hình Credentials vào Máy tính
Mở Terminal trong VS Code và gõ lệnh:
```bash
aws configure
```

Terminal sẽ hỏi bạn 4 câu hỏi, hãy lần lượt copy/paste các thông tin sau:
1. `AWS Access Key ID [None]:` Dán **Access key ID** của bạn vào rồi Enter.
2. `AWS Secret Access Key [None]:` Dán **Secret access key** của bạn vào rồi Enter.
3. `Default region name [None]:` Gõ **`ap-southeast-1`** (đây là cụm server Singapore, mạng về VN sẽ nhanh nhất) rồi Enter.
4. `Default output format [None]:` Gõ **`json`** rồi Enter.

Sau bước này, tài khoản AWS của bạn đã được liên kết với máy tính. Terraform giờ đây có thể toàn quyền sử dụng tài khoản AWS của bạn để triển khai hệ thống!
