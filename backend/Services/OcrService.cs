using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartDorm.Api.Data;
using SmartDorm.Api.Models;

namespace SmartDorm.Api.Services
{
    public interface IOcrService
    {
        Task<object> ProcessCccdAsync(Stream fileStream, string fileName);
        Task<object> ProcessReceiptAsync(Stream fileStream, string fileName);
    }

    public class OcrService : IOcrService
    {
        private readonly AppDbContext _context;

        public OcrService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> ProcessCccdAsync(Stream fileStream, string fileName)
        {
            // Simulate AI processing delay (2 seconds)
            await Task.Delay(2000);

            // Generate realistic mock Vietnamese CCCD data
            var random = new Random();
            var year = random.Next(1990, 2005);
            var month = random.Next(1, 13);
            var day = random.Next(1, 29);
            
            // Standard CCCD Format: 12 digits
            var cccdNum = $"0{random.Next(10, 99)}0{year.ToString().Substring(2)}{random.Next(100000, 999999)}";
            
            // Pick a name from a pool
            var firstNames = new[] { "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ" };
            var middleNames = new[] { "Văn", "Thị", "Quang", "Đăng", "Minh", "Hồng", "Anh", "Tấn" };
            var lastNames = new[] { "Nam", "Mai", "Hải", "Lan", "Hùng", "Trang", "Tuấn", "Phương", "Cường", "Vy" };

            var fullName = $"{firstNames[random.Next(firstNames.Length)]} {middleNames[random.Next(middleNames.Length)]} {lastNames[random.Next(lastNames.Length)]}";

            return new
            {
                Success = true,
                FullName = fullName.ToUpper(),
                Cccd = cccdNum,
                Dob = $"{year}-{month:D2}-{day:D2}",
                Address = "123 Đường Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh",
                Message = "Trích xuất thông tin CCCD thành công"
            };
        }

        public async Task<object> ProcessReceiptAsync(Stream fileStream, string fileName)
        {
            // Simulate AI processing delay (2 seconds)
            await Task.Delay(2000);

            // Query database to find a pending invoice to make the demo 100% functional
            var pendingInvoice = await _context.Invoices
                .Include(i => i.Contract)
                .ThenInclude(c => c.Tenant)
                .FirstOrDefaultAsync(i => i.Status == InvoiceStatus.PENDING);

            var random = new Random();
            var transactionId = $"FT{DateTime.UtcNow:yyMMddHHmmss}{random.Next(1000, 9999)}";

            if (pendingInvoice != null)
            {
                return new
                {
                    Success = true,
                    InvoiceId = pendingInvoice.Id,
                    Amount = pendingInvoice.TotalAmount,
                    TransactionId = transactionId,
                    TenantName = pendingInvoice.Contract?.Tenant?.FullName ?? "Khách thuê",
                    BillingMonth = pendingInvoice.BillingMonth,
                    BillingYear = pendingInvoice.BillingYear,
                    Message = "Nhận diện biên lai thành công. Đã tìm thấy hóa đơn khớp lệnh!"
                };
            }

            // Fallback mock receipt data if no pending invoice is found
            return new
            {
                Success = true,
                InvoiceId = Guid.NewGuid(),
                Amount = 1500000m,
                TransactionId = transactionId,
                TenantName = "Nguyễn Văn Trội",
                BillingMonth = DateTime.UtcNow.Month,
                BillingYear = DateTime.UtcNow.Year,
                Message = "Nhận diện biên lai thành công (Sử dụng dữ liệu mẫu)"
            };
        }
    }
}
