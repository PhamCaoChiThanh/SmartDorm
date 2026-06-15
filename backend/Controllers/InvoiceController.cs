using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartDorm.Api.Data;
using SmartDorm.Api.Models;
using SmartDorm.Api.Services;

namespace SmartDorm.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/invoices")]
    public class InvoiceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IPdfService _pdfService;

        public InvoiceController(AppDbContext context, IEmailService emailService, IPdfService pdfService)
        {
            _context = context;
            _emailService = emailService;
            _pdfService = pdfService;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetAllInvoices()
        {
            try
            {
                var invoices = await _context.Invoices
                    .Include(i => i.Contract)
                        .ThenInclude(c => c!.Room)
                    .OrderByDescending(i => i.BillingYear)
                    .ThenByDescending(i => i.BillingMonth)
                    .ThenBy(i => i.Contract != null && i.Contract.Room != null ? i.Contract.Room.RoomNumber : string.Empty)
                    .Select(i => new
                    {
                        i.Id,
                        i.ContractId,
                        room_id = i.Contract != null ? i.Contract.RoomId : null,
                        room_number = i.Contract != null && i.Contract.Room != null ? i.Contract.Room.RoomNumber : string.Empty,
                        billing_month = i.BillingMonth,
                        billing_year = i.BillingYear,
                        room_fee = i.RoomFee,
                        electric_fee = i.ElectricFee,
                        water_fee = i.WaterFee,
                        total_amount = i.TotalAmount,
                        paid_amount = i.PaidAmount,
                        status = i.Status.ToString(),
                        created_at = i.CreatedAt,
                        updated_at = i.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = invoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách hóa đơn", error = ex.Message });
            }
        }

        public class GenerateInvoiceDto
        {
            public Guid ContractId { get; set; }
            public int BillingMonth { get; set; }
            public int BillingYear { get; set; }
        }

        [HttpPost("generate")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> GenerateMonthlyInvoice([FromBody] GenerateInvoiceDto dto)
        {
            try
            {
                // 1. Verify invoice doesn't exist already
                var exists = await _context.Invoices.AnyAsync(i =>
                    i.ContractId == dto.ContractId &&
                    i.BillingMonth == dto.BillingMonth &&
                    i.BillingYear == dto.BillingYear);

                if (exists)
                {
                    return BadRequest(new { success = false, message = "Hóa đơn cho tháng này đã được tạo." });
                }

                // 2. Fetch contract & room info
                var contract = await _context.Contracts
                    .Include(c => c.Room)
                    .FirstOrDefaultAsync(c => c.Id == dto.ContractId);

                if (contract == null || contract.Room == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hợp đồng hoặc thông tin phòng." });
                }

                var room = contract.Room;

                // 3. Fetch utility usages for the room in this billing month/year
                var utilityUsages = await _context.UtilityUsages
                    .Where(uu => uu.RoomId == room.Id && uu.BillingMonth == dto.BillingMonth && uu.BillingYear == dto.BillingYear)
                    .ToListAsync();

                int electricUsage = 0;
                int waterUsage = 0;

                foreach (var usage in utilityUsages)
                {
                    int consumed = usage.NewIndex - usage.OldIndex;
                    if (usage.Type == UtilityType.ELECTRIC)
                    {
                        electricUsage = consumed;
                    }
                    else if (usage.Type == UtilityType.WATER)
                    {
                        waterUsage = consumed;
                    }
                }

                // 4. Calculate fees
                decimal roomFee = room.BasePrice;
                decimal electricFee = electricUsage * room.ElectricityPrice;
                decimal waterFee = waterUsage * room.WaterPrice;
                decimal totalAmount = roomFee + electricFee + waterFee;

                // 5. Save invoice
                var invoice = new Invoice
                {
                    ContractId = dto.ContractId,
                    BillingMonth = dto.BillingMonth,
                    BillingYear = dto.BillingYear,
                    RoomFee = roomFee,
                    ElectricFee = electricFee,
                    WaterFee = waterFee,
                    TotalAmount = totalAmount,
                    PaidAmount = 0,
                    Status = InvoiceStatus.PENDING
                };

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { success = true, message = "Tạo hóa đơn thành công", data = invoice });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi tạo hóa đơn", error = ex.Message });
            }
        }

        public class PayInvoiceDto
        {
            public string? PaymentMethod { get; set; }
        }

        [HttpPost("{id}/pay")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> PayInvoice(Guid id, [FromBody] PayInvoiceDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Fetch invoice
                var invoice = await _context.Invoices.FindAsync(id);
                if (invoice == null || invoice.Status == InvoiceStatus.PAID)
                {
                    return BadRequest(new { success = false, message = "Hóa đơn không tồn tại hoặc đã được thanh toán." });
                }

                // Update invoice
                invoice.Status = InvoiceStatus.PAID;
                invoice.PaidAmount = invoice.TotalAmount ?? 0;
                invoice.UpdatedAt = DateTimeOffset.UtcNow;

                // Create payment record
                var payment = new Payment
                {
                    InvoiceId = id,
                    Amount = invoice.TotalAmount ?? 0,
                    PaymentMethod = dto.PaymentMethod ?? "CASH",
                    PaymentDate = DateTimeOffset.UtcNow
                };

                _context.Payments.Add(payment);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Thanh toán thành công", data = invoice });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi thanh toán", error = ex.Message });
            }
        }

        [HttpGet("{id}/pdf")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> DownloadInvoicePdf(Guid id)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Contract)
                        .ThenInclude(c => c!.Tenant)
                    .Include(i => i.Contract)
                        .ThenInclude(c => c!.Room)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (invoice == null)
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn" });

                var tenant = invoice.Contract?.Tenant;
                var room = invoice.Contract?.Room;

                if (tenant == null || room == null)
                    return BadRequest(new { success = false, message = "Thiếu thông tin tenant hoặc phòng" });

                // Fetch utility usages for this billing period
                var usages = await _context.UtilityUsages
                    .Where(u => u.RoomId == room.Id && u.BillingMonth == invoice.BillingMonth && u.BillingYear == invoice.BillingYear)
                    .ToListAsync();

                var pdfBytes = _pdfService.GenerateInvoicePdf(invoice, tenant, room, usages);
                var fileName = $"HoaDon_Phong{room.RoomNumber}_T{invoice.BillingMonth}_{invoice.BillingYear}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi tạo PDF", error = ex.Message });
            }
        }

        [HttpPost("{id}/send")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> SendInvoice(Guid id)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Contract)
                        .ThenInclude(c => c!.Tenant)
                    .Include(i => i.Contract)
                        .ThenInclude(c => c!.Room)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (invoice == null)
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn" });

                var tenant = invoice.Contract?.Tenant;
                var room = invoice.Contract?.Room;

                if (tenant == null || string.IsNullOrEmpty(tenant.Email))
                    return BadRequest(new { success = false, message = $"Không có email sinh viên. Tenant: {tenant?.FullName}, Email: {tenant?.Email ?? "null"}" });

                if (room == null)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin phòng." });

                // Fetch utility usages for this billing period
                var usages = await _context.UtilityUsages
                    .Where(u => u.RoomId == room.Id && u.BillingMonth == invoice.BillingMonth && u.BillingYear == invoice.BillingYear)
                    .ToListAsync();

                var pdfBytes = _pdfService.GenerateInvoicePdf(invoice, tenant, room, usages);
                var fileName = $"HoaDon_Phong{room.RoomNumber}_T{invoice.BillingMonth}_{invoice.BillingYear}.pdf";

                string subject = $"📄 Hóa đơn tiền phòng tháng {invoice.BillingMonth}/{invoice.BillingYear} - Phòng {room.RoomNumber}";
                string body = $"<p>Xin chào <b>{tenant.FullName}</b>,</p>" +
                              $"<p>Ban quản lý KTX SmartDorm gửi đến bạn <b>Hóa đơn tiền phòng</b> tháng <b>{invoice.BillingMonth}/{invoice.BillingYear}</b>.</p>" +
                              $"<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;font-size:14px;'>" +
                              $"<tr style='background:#1e3a5f;color:white'><th>Khoản mục</th><th>Thành tiền</th></tr>" +
                              $"<tr><td>Tiền phòng</td><td><b>{invoice.RoomFee:N0} VND</b></td></tr>" +
                              $"<tr style='background:#f8f9fa'><td>Điện</td><td><b>{invoice.ElectricFee:N0} VND</b></td></tr>" +
                              $"<tr><td>Nước</td><td><b>{invoice.WaterFee:N0} VND</b></td></tr>" +
                              $"<tr style='background:#1e3a5f;color:white'><th>TỔNG CỘNG</th><th>{invoice.TotalAmount:N0} VND</th></tr>" +
                              $"</table>" +
                              $"<p>⏰ Hạn thanh toán: ngày <b>05/{invoice.BillingMonth}/{invoice.BillingYear}</b>.</p>" +
                              $"<p>📎 Hóa đơn chi tiết được đính kèm theo email này.</p>";

                await _emailService.SendEmailAsync(tenant.Email, subject, body, pdfBytes, fileName);

                return Ok(new { success = true, message = $"Gửi hóa đơn đến {tenant.Email} thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi gửi hóa đơn", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
}
