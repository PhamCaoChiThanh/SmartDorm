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
    [Authorize(Roles = "ADMIN,MANAGER")]
    [ApiController]
    [Route("api/contracts")]
    public class ContractController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IPdfService _pdfService;

        public ContractController(AppDbContext context, IEmailService emailService, IPdfService pdfService)
        {
            _context = context;
            _emailService = emailService;
            _pdfService = pdfService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllContracts()
        {
            try
            {
                var contracts = await _context.Contracts
                    .Include(c => c.Tenant)
                    .Include(c => c.Room)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new
                    {
                        c.Id,
                        c.TenantId,
                        tenant_name = c.Tenant != null ? c.Tenant.FullName : string.Empty,
                        c.RoomId,
                        room_number = c.Room != null ? c.Room.RoomNumber : string.Empty,
                        base_price = c.Room != null ? c.Room.BasePrice : 0,
                        start_date = c.StartDate,
                        end_date = c.EndDate,
                        c.Status,
                        c.WasRenewed,
                        c.CreatedAt,
                        c.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = contracts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách hợp đồng", error = ex.Message });
            }
        }

        public class CreateContractDto
        {
            public Guid TenantId { get; set; }
            public Guid RoomId { get; set; }
            public DateOnly StartDate { get; set; }
            public DateOnly EndDate { get; set; }
            public decimal DepositAmount { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> CreateContract([FromBody] CreateContractDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Verify tenant and room exist
                var tenantExists = await _context.Tenants.AnyAsync(t => t.Id == dto.TenantId);
                var room = await _context.Rooms.FindAsync(dto.RoomId);

                if (!tenantExists)
                {
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin sinh viên." });
                }

                if (room == null)
                {
                    return BadRequest(new { success = false, message = "Không tìm thấy phòng." });
                }

                // 1. Create contract
                var contract = new Contract
                {
                    TenantId = dto.TenantId,
                    RoomId = dto.RoomId,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    Status = ContractStatus.ACTIVE
                };

                _context.Contracts.Add(contract);
                await _context.SaveChangesAsync(); // save to generate contract.Id

                // 1.5. Create deposit if DepositAmount > 0
                if (dto.DepositAmount > 0)
                {
                    var deposit = new Deposit
                    {
                        ContractId = contract.Id,
                        TotalAmount = dto.DepositAmount,
                        RemainingBalance = dto.DepositAmount,
                        Status = "HOLDING",
                        CreatedAt = DateTimeOffset.UtcNow,
                        UpdatedAt = DateTimeOffset.UtcNow
                    };
                    _context.Deposits.Add(deposit);
                    await _context.SaveChangesAsync(); // save to generate deposit.Id

                    var depositTransaction = new DepositTransaction
                    {
                        DepositId = deposit.Id,
                        Amount = dto.DepositAmount,
                        TransactionType = "RECEIVE",
                        Reason = "Thu tiền đặt cọc khi bắt đầu hợp đồng",
                        CreatedAt = DateTimeOffset.UtcNow
                    };
                    _context.DepositTransactions.Add(depositTransaction);
                }

                // 2. Update room status based on capacity
                var activeContractsCount = await _context.Contracts.CountAsync(c => c.RoomId == dto.RoomId && c.Status == ContractStatus.ACTIVE);
                if (activeContractsCount >= room.Capacity)
                {
                    room.Status = RoomStatus.OCCUPIED;
                }
                else
                {
                    room.Status = RoomStatus.AVAILABLE;
                }
                room.UpdatedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return StatusCode(201, new
                {
                    success = true,
                    message = "Tạo hợp đồng thành công và đã cập nhật trạng thái phòng",
                    data = contract
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi tạo hợp đồng", error = ex.Message });
            }
        }

        [HttpPut("{id}/terminate")]
        public async Task<IActionResult> TerminateContract(Guid id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Update contract status to TERMINATED
                var contract = await _context.Contracts
                    .Include(c => c.Tenant)
                    .Include(c => c.Room)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (contract == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hợp đồng" });
                }

                contract.Status = ContractStatus.TERMINATED;
                contract.UpdatedAt = DateTimeOffset.UtcNow;

                // 2. Update room status based on remaining active contracts
                if (contract.RoomId != null)
                {
                    var room = await _context.Rooms.FindAsync(contract.RoomId);
                    if (room != null)
                    {
                        var activeContractsCount = await _context.Contracts.CountAsync(c => c.RoomId == contract.RoomId && c.Status == ContractStatus.ACTIVE && c.Id != contract.Id);
                        if (activeContractsCount >= room.Capacity)
                        {
                            room.Status = RoomStatus.OCCUPIED;
                        }
                        else
                        {
                            room.Status = RoomStatus.AVAILABLE;
                        }
                        room.UpdatedAt = DateTimeOffset.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Generate termination PDF and send email notification to Tenant
                if (contract.Tenant != null && !string.IsNullOrEmpty(contract.Tenant.Email))
                {
                    string subject = $"Biên bản CHẤM DỨT hợp đồng thuê phòng {contract.Room?.RoomNumber}";
                    string body = $"<p>Xin chào <b>{contract.Tenant.FullName}</b>,</p>" +
                                  $"<p>Ban quản lý KTX SmartDorm xin thông báo: Hợp đồng thuê phòng số <b>{contract.Room?.RoomNumber}</b> của bạn đã được <b>chấm dứt chính thức</b> kể từ hôm nay.</p>" +
                                  $"<p>📎 <b>Biên bản chấm dứt hợp đồng</b> được đính kèm theo email này. Vui lòng lưu giữ để đối chiếu khi cần thiết.</p>" +
                                  $"<p>Vui lòng hoàn tất thủ tục bàn giao phòng và thanh toán các khoản chi phí còn lại trước khi rời KTX.</p>" +
                                  $"<p>Cảm ơn bạn đã đồng hành cùng SmartDorm trong thời gian qua. Chúc bạn mọi điều tốt đẹp!</p>";

                    var pdfBytes = _pdfService.GenerateTerminationPdf(contract.Tenant, contract.Room!, contract);
                    var fileName = $"BienBanChamDutHopDong_{contract.Room?.RoomNumber}.pdf";

                    _ = Task.Run(() => _emailService.SendEmailAsync(contract.Tenant.Email, subject, body, pdfBytes, fileName));
                }

                return Ok(new
                {
                    success = true,
                    message = "Đã kết thúc hợp đồng và giải phóng phòng thành công"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi kết thúc hợp đồng", error = ex.Message });
            }
        }

        public class RenewContractDto
        {
            public string EndDate { get; set; } = string.Empty;
        }

        [HttpPut("{id}/renew")]
        public async Task<IActionResult> RenewContract(Guid id, [FromBody] RenewContractDto dto)
        {
            try
            {
                var contract = await _context.Contracts
                    .Include(c => c.Tenant)
                    .Include(c => c.Room)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (contract == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hợp đồng" });
                }

                if (contract.Status != ContractStatus.ACTIVE)
                {
                    return BadRequest(new { success = false, message = "Chỉ có thể gia hạn hợp đồng đang còn hiệu lực." });
                }

                if (!DateOnly.TryParse(dto.EndDate, out var parsedDate))
                {
                    return BadRequest(new { success = false, message = "Ngày kết thúc không hợp lệ." });
                }

                if (parsedDate <= contract.EndDate)
                {
                    return BadRequest(new { success = false, message = "Ngày gia hạn mới phải sau ngày kết thúc hợp đồng hiện tại." });
                }

                contract.EndDate = parsedDate;
                contract.WasRenewed = true;
                contract.UpdatedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                // Generate renewal PDF and send email notification to Tenant
                if (contract.Tenant != null && !string.IsNullOrEmpty(contract.Tenant.Email))
                {
                    string subject = $"Phụ lục GIA HẠN hợp đồng thuê phòng {contract.Room?.RoomNumber}";
                    string body = $"<p>Xin chào <b>{contract.Tenant.FullName}</b>,</p>" +
                                  $"<p>Ban quản lý KTX SmartDorm xin thông báo: Hợp đồng thuê phòng số <b>{contract.Room?.RoomNumber}</b> của bạn đã được <b>gia hạn thành công</b>.</p>" +
                                  $"<p>📅 Thời hạn hợp đồng mới sẽ kéo dài đến ngày <b>{parsedDate.ToString("dd/MM/yyyy")}</b>.</p>" +
                                  $"<p>📎 <b>Phụ lục gia hạn hợp đồng</b> được đính kèm theo email này. Vui lòng lưu giữ để đối chiếu khi cần thiết.</p>" +
                                  $"<p>Bạn có thể đăng nhập vào hệ thống để kiểm tra thông tin chi tiết hợp đồng mới.</p>";

                    var pdfBytes = _pdfService.GenerateRenewalPdf(contract.Tenant, contract.Room!, contract, parsedDate);
                    var fileName = $"PhuLucGiaHanHopDong_{contract.Room?.RoomNumber}.pdf";

                    _ = Task.Run(() => _emailService.SendEmailAsync(contract.Tenant.Email, subject, body, pdfBytes, fileName));
                }

                return Ok(new
                {
                    success = true,
                    message = "Gia hạn hợp đồng thành công",
                    data = contract
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi gia hạn hợp đồng", error = ex.Message });
            }
        }

        [HttpGet("{id}/pdf")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetContractPdf(Guid id)
        {
            try
            {
                var contract = await _context.Contracts
                    .Include(c => c.Tenant)
                    .Include(c => c.Room)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (contract == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hợp đồng" });
                }

                var mockRequest = new RoomRequest
                {
                    MoveInDate = contract.StartDate
                };

                var pdfBytes = _pdfService.GenerateContractPdf(contract.Tenant!, contract.Room!, mockRequest);
                var fileName = $"HopDongThuePhong_{contract.Room?.RoomNumber}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xuất PDF hợp đồng", error = ex.Message });
            }
        }

        [HttpGet("{id}/pdf/termination")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetTerminationPdf(Guid id)
        {
            try
            {
                var contract = await _context.Contracts
                    .Include(c => c.Tenant)
                    .Include(c => c.Room)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (contract == null)
                    return NotFound(new { success = false, message = "Không tìm thấy hợp đồng" });

                if (contract.Status != ContractStatus.TERMINATED)
                    return BadRequest(new { success = false, message = "Hợp đồng chưa được chấm dứt." });

                var pdfBytes = _pdfService.GenerateTerminationPdf(contract.Tenant!, contract.Room!, contract);
                var fileName = $"BienBanChamDutHopDong_{contract.Room?.RoomNumber}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xuất biên bản chấm dứt", error = ex.Message });
            }
        }

        [HttpGet("{id}/pdf/renewal")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetRenewalPdf(Guid id)
        {
            try
            {
                var contract = await _context.Contracts
                    .Include(c => c.Tenant)
                    .Include(c => c.Room)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (contract == null)
                    return NotFound(new { success = false, message = "Không tìm thấy hợp đồng" });

                var pdfBytes = _pdfService.GenerateRenewalPdf(contract.Tenant!, contract.Room!, contract, contract.EndDate);
                var fileName = $"PhuLucGiaHanHopDong_{contract.Room?.RoomNumber}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xuất phụ lục gia hạn", error = ex.Message });
            }
        }
    }
}
