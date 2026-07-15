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
        [DisableRequestSizeLimit]
        [RequestFormLimits(MultipartBodyLengthLimit = 209715200)] // 200MB limit
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có file nào được tải lên.");
            }

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var key = $"uploads/{uniqueFileName}";

            // 1. Try uploading to AWS S3 first
            try
            {
                var bucketName = _configuration["AWS:BucketName"] ?? _configuration["S3_ASSETS_BUCKET"];
                if (!string.IsNullOrEmpty(bucketName) && !bucketName.Contains("YOUR_AWS") && !bucketName.Contains("smartdorm-s3-bucket"))
                {
                    using (var stream = file.OpenReadStream())
                    {
                        var putRequest = new PutObjectRequest
                        {
                            BucketName = bucketName,
                            Key = key,
                            InputStream = stream,
                            ContentType = file.ContentType
                        };
                        await _s3Client.PutObjectAsync(putRequest);
                    }

                    var region = _configuration["AWS:Region"] ?? "ap-southeast-1";
                    var fileUrl = $"https://{bucketName}.s3.{region}.amazonaws.com/{key}";

                    return Ok(new
                    {
                        Url = fileUrl,
                        Key = key,
                        FileName = file.FileName
                    });
                }
            }
            catch (Exception s3Ex)
            {
                Console.WriteLine($"S3 upload failed, falling back to local: {s3Ex.Message}");
            }

            // 2. Fallback to Local Storage (for local dev environments)
            try
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var request = HttpContext.Request;
                var fileUrl = $"{request.Scheme}://{request.Host}/uploads/{uniqueFileName}";

                return Ok(new
                {
                    Url = fileUrl,
                    Key = key,
                    FileName = file.FileName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống khi tải file lên: {ex.Message}");
            }
        }
    }
}
