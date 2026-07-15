---
title: "5.5 S3 Storage & Upload integration"
date: 2026-07-10
weight: 5
chapter: false
---

## 5.5 Amazon S3 Storage & Upload Integration

Resolving AWS Lambda's read-only disk layout constraints using S3 object store APIs.

### 1. Creating IAM Policies for S3 Permissions
We attach S3 write permissions to the Lambda role via Terraform:
```hcl
resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "smartdorm_lambda_s3_policy"
  role = aws_iam_role.lambda_exec_role.id

  # Grant S3 Action privileges
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
          "${aws_s3_bucket.frontend_bucket.arn}/*"
        ]
      }
    ]
  })
}
```

### 2. C# S3 SDK Implementation Snippet (`UploadController.cs`)
The endpoint checks for S3 configuration details. If present, it writes to S3; otherwise, it defaults to local disk writes during localhost testing:
```csharp
[HttpPost]
public async Task<IActionResult> UploadFile(IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest(new { success = false, message = "File is empty" });

    // Read the S3 bucket configuration environment variable
    var bucketName = Environment.GetEnvironmentVariable("AWS__BucketName");

    if (!string.IsNullOrEmpty(bucketName))
    {
        try
        {
            // Upload to S3 bucket directly
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

            // Return public HTTPS URI reference
            var publicUrl = $"https://{bucketName}.s3.amazonaws.com/{fileKey}";
            return Ok(new { success = true, url = publicUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "S3 upload failed", error = ex.Message });
        }
    }

    // LOCAL SYSTEM FALLBACK: Used for local testing
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
