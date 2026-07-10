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
                        tenant_name = i.Contract != null && i.Contract.Tenant != null ? i.Contract.Tenant.FullName : string.Empty,
                        billing_month = i.BillingMonth,
                        billing_year = i.BillingYear,
                        room_fee = i.RoomFee,
                        electric_fee = i.ElectricFee,
                        water_fee = i.WaterFee,
                        total_amount = i.TotalAmount,
                        paid_amount = i.PaidAmount,
                        status = i.Status.ToString(),
                        sent_at = i.SentAt,
                        payment_date = i.PaymentDate,
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

                // Count active roommates (occupants) in the room to share/divide the bill
                var activeContractsCount = await _context.Contracts
                    .CountAsync(c => c.RoomId == room.Id && c.Status == ContractStatus.ACTIVE);
                int divisor = activeContractsCount > 0 ? activeContractsCount : 1;

                // 4. Calculate fees
                decimal roomFee = divisor > 1 ? room.BasePrice / divisor : room.BasePrice;
                decimal electricFee = divisor > 1 ? (electricUsage * room.ElectricityPrice) / divisor : (electricUsage * room.ElectricityPrice);
                decimal waterFee = divisor > 1 ? (waterUsage * room.WaterPrice) / divisor : (waterUsage * room.WaterPrice);
                decimal totalAmount = roomFee + electricFee + waterFee + (room.GarbageFee / divisor);

                // 5. Save invoices for ALL active contracts in the same room
                var activeContracts = await _context.Contracts
                    .Where(c => c.RoomId == room.Id && c.Status == ContractStatus.ACTIVE)
                    .ToListAsync();

                Invoice? targetInvoice = null;
                foreach (var c in activeContracts)
                {
                    var invExists = await _context.Invoices.AnyAsync(i =>
                        i.ContractId == c.Id &&
                        i.BillingMonth == dto.BillingMonth &&
                        i.BillingYear == dto.BillingYear);
                    
                    if (!invExists)
                    {
                        var inv = new Invoice
                        {
                            ContractId = c.Id,
                            BillingMonth = dto.BillingMonth,
                            BillingYear = dto.BillingYear,
                            RoomFee = roomFee,
                            ElectricFee = electricFee,
                            WaterFee = waterFee,
                            TotalAmount = totalAmount,
                            PaidAmount = 0,
                            Status = InvoiceStatus.PENDING
                        };
                        _context.Invoices.Add(inv);
                        if (c.Id == dto.ContractId)
                        {
                            targetInvoice = inv;
                        }

                        // Auto-generate parking invoice if the tenant has active approved parking registrations
                        var activeParkingRegistrations = await _context.ParkingRegistrations
                            .Where(r => r.TenantId == c.TenantId && r.Status == RequestStatus.APPROVED && r.EndDate == null)
                            .ToListAsync();

                        foreach (var reg in activeParkingRegistrations)
                        {
                            var hasParkingInv = await _context.ParkingInvoices
                                .AnyAsync(pi => pi.RegistrationId == reg.Id && pi.BillingMonth == dto.BillingMonth && pi.BillingYear == dto.BillingYear);
                            if (!hasParkingInv)
                            {
                                var parkingInvoice = new ParkingInvoice
                                {
                                    RegistrationId = reg.Id,
                                    BillingMonth = dto.BillingMonth,
                                    BillingYear = dto.BillingYear,
                                    Amount = reg.FeePerPeriod,
                                    Status = InvoiceStatus.PENDING,
                                    CreatedAt = DateTimeOffset.UtcNow,
                                    UpdatedAt = DateTimeOffset.UtcNow
                                };
                                _context.ParkingInvoices.Add(parkingInvoice);
                            }
                        }
                    }
                }
                await _context.SaveChangesAsync();

                return StatusCode(201, new { success = true, message = "Tạo hóa đơn cho các thành viên thành công", data = targetInvoice });
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

                // Check role
                var isTenant = User.IsInRole("TENANT");
                if (isTenant)
                {
                    // Tenant is notifying they transferred
                    invoice.Status = InvoiceStatus.WAITING_APPROVAL;
                    invoice.PaymentDate = DateTimeOffset.UtcNow; // Record when they requested approval
                    invoice.UpdatedAt = DateTimeOffset.UtcNow;

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { success = true, message = "Đã gửi thông báo thanh toán cho Quản trị viên phê duyệt.", data = invoice });
                }

                // Otherwise, Admin/Manager paying directly
                invoice.Status = InvoiceStatus.PAID;
                invoice.PaidAmount = invoice.TotalAmount ?? 0;
                invoice.PaymentDate = DateTimeOffset.UtcNow;
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

                // Send Paid Confirmation Email with Invoice PDF in Background
                try
                {
                    var fullInvoice = await _context.Invoices
                        .Include(i => i.Contract)
                            .ThenInclude(c => c!.Tenant)
                        .Include(i => i.Contract)
                            .ThenInclude(c => c!.Room)
                        .FirstOrDefaultAsync(i => i.Id == id);

                    var tenant = fullInvoice?.Contract?.Tenant;
                    var room = fullInvoice?.Contract?.Room;

                    if (tenant != null && room != null && !string.IsNullOrEmpty(tenant.Email))
                    {
                        var usages = await _context.UtilityUsages
                            .Where(u => u.RoomId == room.Id && u.BillingMonth == fullInvoice.BillingMonth && u.BillingYear == fullInvoice.BillingYear)
                            .ToListAsync();

                        var roommateCount = await _context.Contracts
                            .CountAsync(c => c.RoomId == room.Id && c.Status == ContractStatus.ACTIVE);
                        if (roommateCount <= 0) roommateCount = 1;

                        var pdfBytes = _pdfService.GenerateInvoicePdf(fullInvoice, tenant, room, usages, roommateCount);
                        var fileName = $"HoaDon_DaThanhToan_Phong{room.RoomNumber}_T{fullInvoice.BillingMonth}_{fullInvoice.BillingYear}.pdf";

                        string subject = $"✅ [SmartDorm] Xác nhận thanh toán hóa đơn tháng {fullInvoice.BillingMonth}/{fullInvoice.BillingYear} - Phòng {room.RoomNumber}";
                        string body = $"<p>Xin chào <b>{tenant.FullName}</b>,</p>" +
                                      $"<p>Ban quản lý KTX SmartDorm xác nhận đã nhận được khoản thanh toán cho <b>Hóa đơn tiền phòng</b> tháng <b>{fullInvoice.BillingMonth}/{fullInvoice.BillingYear}</b>.</p>" +
                                      $"<p>Trạng thái hóa đơn: <b style='color:green'>ĐÃ THANH TOÁN</b></p>" +
                                      $"<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;font-size:14px;'>" +
                                      $"<tr style='background:#1e3a5f;color:white'><th>Khoản mục</th><th>Thành tiền</th></tr>" +
                                      $"<tr><td>Tiền phòng</td><td><b>{fullInvoice.RoomFee:N0} VND</b></td></tr>" +
                                      $"<tr style='background:#f8f9fa'><td>Điện</td><td><b>{fullInvoice.ElectricFee:N0} VND</b></td></tr>" +
                                      $"<tr><td>Nước</td><td><b>{fullInvoice.WaterFee:N0} VND</b></td></tr>" +
                                      $"<tr style='background:#1e3a5f;color:white'><th>TỔNG CỘNG</th><th>{fullInvoice.TotalAmount:N0} VND</th></tr>" +
                                      $"</table>" +
                                      $"<p>Cảm ơn bạn đã thực hiện thanh toán đầy đủ. Chi tiết hóa đơn biên lai thanh toán được đính kèm ở file PDF trong email này.</p>";

                        // Send confirmation email
                        await _emailService.SendEmailAsync(tenant.Email, subject, body, pdfBytes, fileName);
                    }
                }
                catch (Exception mailEx)
                {
                    // Log error and continue since transaction committed successfully
                    Console.WriteLine("Lỗi tự động gửi email hóa đơn: " + mailEx.Message);
                }

                return Ok(new { success = true, message = "Thanh toán thành công", data = invoice });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi thanh toán", error = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> ApproveInvoice(Guid id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var invoice = await _context.Invoices.FindAsync(id);
                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn" });
                }

                if (invoice.Status == InvoiceStatus.PAID)
                {
                    return BadRequest(new { success = false, message = "Hóa đơn đã được thanh toán rồi." });
                }

                // Update invoice
                invoice.Status = InvoiceStatus.PAID;
                invoice.PaidAmount = invoice.TotalAmount ?? 0;
                invoice.PaymentDate = DateTimeOffset.UtcNow;
                invoice.UpdatedAt = DateTimeOffset.UtcNow;

                // Create payment record
                var payment = new Payment
                {
                    InvoiceId = id,
                    Amount = invoice.TotalAmount ?? 0,
                    PaymentMethod = "BANK_TRANSFER",
                    PaymentDate = DateTimeOffset.UtcNow
                };

                _context.Payments.Add(payment);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Send Paid Confirmation Email with Invoice PDF in Background
                try
                {
                    var fullInvoice = await _context.Invoices
                        .Include(i => i.Contract)
                            .ThenInclude(c => c!.Tenant)
                        .Include(i => i.Contract)
                            .ThenInclude(c => c!.Room)
                        .FirstOrDefaultAsync(i => i.Id == id);

                    var tenant = fullInvoice?.Contract?.Tenant;
                    var room = fullInvoice?.Contract?.Room;

                    if (tenant != null && room != null && !string.IsNullOrEmpty(tenant.Email))
                    {
                        var usages = await _context.UtilityUsages
                            .Where(u => u.RoomId == room.Id && u.BillingMonth == fullInvoice.BillingMonth && u.BillingYear == fullInvoice.BillingYear)
                            .ToListAsync();

                        var roommateCount = await _context.Contracts
                            .CountAsync(c => c.RoomId == room.Id && c.Status == ContractStatus.ACTIVE);
                        if (roommateCount <= 0) roommateCount = 1;

                        var pdfBytes = _pdfService.GenerateInvoicePdf(fullInvoice, tenant, room, usages, roommateCount);
                        var fileName = $"HoaDon_DaThanhToan_Phong{room.RoomNumber}_T{fullInvoice.BillingMonth}_{fullInvoice.BillingYear}.pdf";

                        string subject = $"✅ [SmartDorm] Xác nhận thanh toán hóa đơn tháng {fullInvoice.BillingMonth}/{fullInvoice.BillingYear} - Phòng {room.RoomNumber}";
                        string body = $"<p>Xin chào <b>{tenant.FullName}</b>,</p>" +
                                      $"<p>Ban quản lý KTX SmartDorm xác nhận đã nhận được khoản thanh toán cho <b>Hóa đơn tiền phòng</b> tháng <b>{fullInvoice.BillingMonth}/{fullInvoice.BillingYear}</b>.</p>" +
                                      $"<p>Trạng thái hóa đơn: <b style='color:green'>ĐÃ THANH TOÁN</b></p>" +
                                      $"<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse;font-size:14px;'>" +
                                      $"<tr style='background:#1e3a5f;color:white'><th>Khoản mục</th><th>Thành tiền</th></tr>" +
                                      $"<tr><td>Tiền phòng</td><td><b>{fullInvoice.RoomFee:N0} VND</b></td></tr>" +
                                      $"<tr style='background:#f8f9fa'><td>Điện</td><td><b>{fullInvoice.ElectricFee:N0} VND</b></td></tr>" +
                                      $"<tr><td>Nước</td><td><b>{fullInvoice.WaterFee:N0} VND</b></td></tr>" +
                                      $"<tr style='background:#f8f9fa'><td>Phí rác</td><td><b>{(fullInvoice.TotalAmount - fullInvoice.RoomFee - fullInvoice.ElectricFee - fullInvoice.WaterFee):N0} VND</b></td></tr>" +
                                      $"<tr style='background:#e2e8f0'><td><b>Tổng cộng</b></td><td><b style='color:#b91c1c'>{fullInvoice.TotalAmount:N0} VND</b></td></tr>" +
                                      $"</table>" +
                                      $"<p>Hóa đơn chi tiết định dạng PDF đã được đính kèm trong email này.</p>" +
                                      $"<p>Trân trọng,<br>Ban quản lý KTX SmartDorm</p>";

                        await _emailService.SendEmailAsync(tenant.Email, subject, body, pdfBytes, fileName);
                    }
                }
                catch (Exception mailEx)
                {
                    Console.WriteLine("Lỗi gửi email xác nhận đã duyệt hóa đơn: " + mailEx.Message);
                }

                return Ok(new { success = true, message = "Duyệt thanh toán hóa đơn thành công." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi duyệt thanh toán", error = ex.Message });
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

                var roommateCount = await _context.Contracts
                    .CountAsync(c => c.RoomId == room.Id && c.Status == ContractStatus.ACTIVE);
                if (roommateCount <= 0) roommateCount = 1;

                var pdfBytes = _pdfService.GenerateInvoicePdf(invoice, tenant, room, usages, roommateCount);
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

                // Find all active occupants (contracts) in the same room to send them the bill
                var activeContracts = await _context.Contracts
                    .Include(c => c.Tenant)
                    .Where(c => c.RoomId == room.Id && c.Status == ContractStatus.ACTIVE)
                    .ToListAsync();

                var validContracts = activeContracts
                    .Where(c => c.Tenant != null && !string.IsNullOrEmpty(c.Tenant.Email))
                    .ToList();

                if (!validContracts.Any())
                {
                    return BadRequest(new { success = false, message = $"Không tìm thấy thành viên nào có email trong phòng {room.RoomNumber}." });
                }

                // Fetch utility usages for this billing period
                var usages = await _context.UtilityUsages
                    .Where(u => u.RoomId == room.Id && u.BillingMonth == invoice.BillingMonth && u.BillingYear == invoice.BillingYear)
                    .ToListAsync();

                var roommateCount = await _context.Contracts
                    .CountAsync(c => c.RoomId == room.Id && c.Status == ContractStatus.ACTIVE);
                if (roommateCount <= 0) roommateCount = 1;

                var pdfBytes = _pdfService.GenerateInvoicePdf(invoice, tenant, room, usages, roommateCount);
                var fileName = $"HoaDon_Phong{room.RoomNumber}_T{invoice.BillingMonth}_{invoice.BillingYear}.pdf";

                foreach (var contract in validContracts)
                {
                    var recipient = contract.Tenant!;
                    string subject = $"📄 Hóa đơn tiền phòng tháng {invoice.BillingMonth}/{invoice.BillingYear} - Phòng {room.RoomNumber}";
                    string body = $"<p>Xin chào <b>{recipient.FullName}</b>,</p>" +
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

                    await _emailService.SendEmailAsync(recipient.Email!, subject, body, pdfBytes, fileName);
                }

                invoice.SentAt = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();

                var sentEmailsList = string.Join(", ", validContracts.Select(c => c.Tenant!.Email));
                return Ok(new { success = true, message = $"Gửi hóa đơn đến các thành viên trong phòng ({sentEmailsList}) thành công!", data = new { sent_at = invoice.SentAt } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi gửi hóa đơn", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        public class UpdateInvoiceDto
        {
            public decimal? RoomFee { get; set; }
            public decimal? ElectricFee { get; set; }
            public decimal? WaterFee { get; set; }
            public decimal PaidAmount { get; set; }
            public string Status { get; set; } = string.Empty;
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> UpdateInvoice(Guid id, [FromBody] UpdateInvoiceDto dto)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Contract)
                        .ThenInclude(c => c!.Room)
                    .FirstOrDefaultAsync(i => i.Id == id);
                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn" });
                }

                if (Enum.TryParse<InvoiceStatus>(dto.Status, true, out var status))
                {
                    if (status == InvoiceStatus.PAID && invoice.Status != InvoiceStatus.PAID)
                    {
                        invoice.PaymentDate = DateTimeOffset.UtcNow;
                    }
                    else if (status != InvoiceStatus.PAID)
                    {
                        invoice.PaymentDate = null;
                    }
                    invoice.Status = status;
                }

                invoice.RoomFee = dto.RoomFee;
                invoice.ElectricFee = dto.ElectricFee;
                invoice.WaterFee = dto.WaterFee;
                invoice.PaidAmount = dto.PaidAmount;
                decimal garbageFee = invoice.Contract?.Room?.GarbageFee ?? 0;
                invoice.TotalAmount = (dto.RoomFee ?? 0) + (dto.ElectricFee ?? 0) + (dto.WaterFee ?? 0) + garbageFee;
                invoice.UpdatedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật hóa đơn thành công", data = invoice });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật hóa đơn", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> DeleteInvoice(Guid id)
        {
            try
            {
                var invoice = await _context.Invoices.FindAsync(id);
                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn" });
                }

                // Delete associated payments first to prevent foreign key constraint violation
                var payments = await _context.Payments.Where(p => p.InvoiceId == id).ToListAsync();
                if (payments.Any())
                {
                    _context.Payments.RemoveRange(payments);
                }

                _context.Invoices.Remove(invoice);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa hóa đơn thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa hóa đơn", error = ex.Message });
            }
        }
    }
}
