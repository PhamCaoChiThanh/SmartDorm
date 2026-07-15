---
title: "5.5 Cấu hình S3"
date: 2026-07-10
weight: 5
chapter: false
---

## 5.5 Amazon S3 Storage & Upload Integration

Hàm AWS Lambda có cấu trúc thư mục đĩa chỉ đọc (Read-only filesystem), do đó, ta cần lưu các file hình ảnh chứng minh nhân dân/CCCD và ảnh đại diện lên bộ lưu trữ đám mây Amazon S3 công khai.

### 1. Phân quyền IAM Role cho phép Lambda gọi vào S3
Bổ sung chính sách IAM Policy vào tệp Terraform để cấp phép cho Lambda thực hiện hành động ghi ảnh lên S3 Bucket:
```hcl
resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "smartdorm_lambda_s3_policy"
  role = aws_iam_role.lambda_exec_role.id

  # Cấp quyền S3 PutObject và GetObject
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject"
        ]
        Resource = [
          # Chỉ cấp phép ghi đè vào S3 bucket frontend của SmartDorm
          "${aws_s3_bucket.frontend_bucket.arn}/*"
        ]
      }
    ]
  })
}
```

### 2. Viết code xử lý Controller Upload File ở Backend (`UploadController.cs`)
API tiếp nhận file ảnh từ giao diện gửi lên. Nếu chạy ở máy cá nhân (Local) sẽ lưu file vào ổ đĩa. Khi chạy trên môi trường AWS Lambda thực tế sẽ tự động dùng SDK để đưa lên Amazon S3:
```csharp
[HttpPost]
public async Task<IActionResult> UploadFile(IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest(new { success = false, message = "Không tìm thấy file" });

    // Đọc tên S3 bucket từ biến môi trường của Lambda
    var bucketName = Environment.GetEnvironmentVariable("AWS__BucketName");

    if (!string.IsNullOrEmpty(bucketName))
    {
        try
        {
            // Tải ảnh trực tiếp lên Amazon S3
            var s3Client = new AmazonS3Client();
            var fileKey = $"uploads/{Guid.NewGuid()}_{file.FileName}";

            using (var stream = file.OpenReadStream())
            {
                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = fileKey,
                    InputStream = stream,
                    ContentType = file.ContentType
                };
                await s3Client.PutObjectAsync(putRequest);
            }

            // Trả về liên kết HTTPS công khai của ảnh trên S3
            var publicUrl = $"https://{bucketName}.s3.amazonaws.com/{fileKey}";
            return Ok(new { success = true, url = publicUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi khi upload lên S3", error = ex.Message });
        }
    }

    // FALLBACK: Lưu trữ cục bộ khi chạy thử nghiệm trên máy local
    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
    if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

    var fileName = $"{Guid.NewGuid()}_{file.FileName}";
    var filePath = Path.Combine(uploadDir, fileName);

    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    var localUrl = $"/uploads/{fileName}";
    return Ok(new { success = true, url = localUrl });
}
```
