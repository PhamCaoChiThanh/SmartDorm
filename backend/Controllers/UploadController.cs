using System;
using System.IO;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using SmartDorm.Api.Services;

namespace SmartDorm.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IAmazonS3 _s3Client;
        private readonly IConfiguration _configuration;
        private readonly IOcrService _ocrService;

        public UploadController(IAmazonS3 s3Client, IConfiguration configuration, IOcrService ocrService)
        {
            _s3Client = s3Client;
            _configuration = configuration;
            _ocrService = ocrService;
        }

        [HttpPost("ocr-cccd")]
        public async Task<IActionResult> OcrCccd(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có file CCCD nào được tải lên.");
            }

            try
            {
                using (var stream = file.OpenReadStream())
                {
                    var result = await _ocrService.ProcessCccdAsync(stream, file.FileName);
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi xử lý OCR CCCD: {ex.Message}");
            }
        }

        [HttpPost("ocr-receipt")]
        public async Task<IActionResult> OcrReceipt(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có file biên lai nào được tải lên.");
            }

            try
            {
                using (var stream = file.OpenReadStream())
                {
                    var result = await _ocrService.ProcessReceiptAsync(stream, file.FileName);
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi xử lý OCR biên lai: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có file nào được tải lên.");
            }

            var bucketName = _configuration["AWS:BucketName"] ?? "smartdorm-s3-bucket";
            var region = _configuration["AWS:Region"] ?? "ap-southeast-1";

            // Tạo tên file độc nhất để tránh trùng lặp
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var key = $"uploads/{uniqueFileName}";

            try
            {
                using (var newStream = new MemoryStream())
                {
                    await file.CopyToAsync(newStream);
                    newStream.Position = 0;

                    var putRequest = new PutObjectRequest
                    {
                        BucketName = bucketName,
                        Key = key,
                        InputStream = newStream,
                        ContentType = file.ContentType
                    };

                    // Thiết lập quyền đọc công khai cho file trên S3
                    // Lưu ý: AWS S3 Bucket cần được tắt cấu hình "Block Public Access" và cho phép ACL để hoạt động
                    putRequest.CannedACL = S3CannedACL.PublicRead;

                    await _s3Client.PutObjectAsync(putRequest);
                }

                // Đường dẫn URL công khai của file sau khi upload thành công
                var fileUrl = $"https://{bucketName}.s3.{region}.amazonaws.com/{key}";

                return Ok(new
                {
                    Url = fileUrl,
                    Key = key,
                    FileName = file.FileName
                });
            }
            catch (AmazonS3Exception amazonS3Exception)
            {
                return StatusCode(500, $"Lỗi AWS S3: {amazonS3Exception.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống khi tải file lên: {ex.Message}");
            }
        }
    }
}
