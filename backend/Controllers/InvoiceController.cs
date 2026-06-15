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
        private readonly IBedrockService _bedrockService;

        public InvoiceController(AppDbContext context, IBedrockService bedrockService)
        {
            _context = context;
            _bedrockService = bedrockService;
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

        [HttpPost("{id}/reminder")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> GenerateAIInvoiceReminder(Guid id)
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
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn." });
                }

                if (invoice.Contract == null || invoice.Contract.Tenant == null || invoice.Contract.Room == null)
                {
                    return BadRequest(new { success = false, message = "Thông tin hợp đồng, người thuê hoặc phòng liên quan bị thiếu." });
                }

                var tenant = invoice.Contract.Tenant;
                var room = invoice.Contract.Room;

                var pastInvoices = await _context.Invoices
                    .Where(i => i.ContractId == invoice.ContractId && i.Id != id && i.Status == InvoiceStatus.PAID)
                    .ToListAsync();

                string paymentBehavior = "STANDARD_PAYER";
                if (pastInvoices.Any())
                {
                    double totalDelayDays = 0;
                    int calculatedCount = 0;

                    foreach (var past in pastInvoices)
                    {
                        var delay = past.UpdatedAt - past.CreatedAt;
                        totalDelayDays += delay.TotalDays;
                        calculatedCount++;
                    }

                    double averageDelay = totalDelayDays / calculatedCount;

                    if (averageDelay <= 3.0)
                    {
                        paymentBehavior = "GOOD_PAYER";
                    }
                    else if (averageDelay >= 10.0)
                    {
                        paymentBehavior = "LATE_PAYER";
                    }
                }

                var hasOverdue = await _context.Invoices
                    .AnyAsync(i => i.ContractId == invoice.ContractId && i.Id != id && i.Status == InvoiceStatus.OVERDUE);
                if (hasOverdue)
                {
                    paymentBehavior = "LATE_PAYER";
                }

                string billingPeriod = $"{invoice.BillingMonth}/{invoice.BillingYear}";
                decimal amount = invoice.TotalAmount ?? 0;
                
                string reminderText = await _bedrockService.GenerateDebtReminderAsync(
                    tenant.FullName, 
                    room.RoomNumber, 
                    amount, 
                    billingPeriod, 
                    paymentBehavior
                );

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        invoice_id = id,
                        tenant_name = tenant.FullName,
                        room_number = room.RoomNumber,
                        total_amount = amount,
                        billing_period = billingPeriod,
                        payment_behavior = paymentBehavior,
                        reminder_message = reminderText
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi tạo tin nhắc nợ AI", error = ex.Message });
            }
        }
    }
}
