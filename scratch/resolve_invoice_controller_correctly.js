const fs = require('fs');

const controllerPath = 'm:/SmartDorm/backend/Controllers/InvoiceController.cs';
let content = fs.readFileSync(controllerPath, 'utf8');

// 1. Fields replacement
const oldFields = `        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IPdfService _pdfService;`;

const newFields = `        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IPdfService _pdfService;
        private readonly IBedrockService _bedrockService;`;

content = content.replace(oldFields, newFields);

// 2. Constructor replacement
const oldConstructor = `        public InvoiceController(AppDbContext context, IEmailService emailService, IPdfService pdfService)
        {
            _context = context;
            _emailService = emailService;
            _pdfService = pdfService;
        }`;

const newConstructor = `        public InvoiceController(AppDbContext context, IEmailService emailService, IPdfService pdfService, IBedrockService bedrockService)
        {
            _context = context;
            _emailService = emailService;
            _pdfService = pdfService;
            _bedrockService = bedrockService;
        }`;

content = content.replace(oldConstructor, newConstructor);

// 3. Action placement before the last closing braces
const searchEnd = `                return StatusCode(500, new { success = false, message = "Lỗi khi xóa hóa đơn", error = ex.Message });
            }
        }
    }
}`;

const actionContent = `                return StatusCode(500, new { success = false, message = "Lỗi khi xóa hóa đơn", error = ex.Message });
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
                        .ThenInclude(c => c!.Room)
                    .Include(i => i.Contract)
                        .ThenInclude(c => c!.Tenant)
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

                string billingPeriod = \`\${invoice.BillingMonth}/\${invoice.BillingYear}\`;
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
}`;

content = content.replace(searchEnd, actionContent);
fs.writeFileSync(controllerPath, content, 'utf8');
console.log('InvoiceController.cs updated successfully!');
