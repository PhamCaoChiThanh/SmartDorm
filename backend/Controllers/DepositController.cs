using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartDorm.Api.Data;
using SmartDorm.Api.Models;
using System.Collections.Generic;

namespace SmartDorm.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/deposits")]
    public class DepositController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepositController(AppDbContext context)
        {
            _context = context;
        }

        private (Guid userId, string role, bool isValid) GetUserClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
            var roleClaim = User.FindFirst(ClaimTypes.Role) ?? User.FindFirst("role");

            if (userIdClaim == null || roleClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return (Guid.Empty, string.Empty, false);
            }

            return (userId, roleClaim.Value, true);
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetAllDeposits()
        {
            try
            {
                var (userId, role, isValid) = GetUserClaims();
                if (!isValid)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh." });
                }

                var query = _context.Deposits
                    .Include(d => d.Contract)
                        .ThenInclude(c => c!.Tenant)
                    .Include(d => d.Contract)
                        .ThenInclude(c => c!.Room)
                    .AsQueryable();

                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null)
                    {
                        return Ok(new { success = true, data = new List<object>() });
                    }
                    query = query.Where(d => d.Contract!.TenantId == tenant.Id);
                }

                var deposits = await query
                    .OrderByDescending(d => d.CreatedAt)
                    .Select(d => new
                    {
                        d.Id,
                        d.ContractId,
                        tenant_name = d.Contract != null && d.Contract.Tenant != null ? d.Contract.Tenant.FullName : string.Empty,
                        room_number = d.Contract != null && d.Contract.Room != null ? d.Contract.Room.RoomNumber : string.Empty,
                        d.TotalAmount,
                        d.RemainingBalance,
                        d.Status,
                        d.CreatedAt,
                        d.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = deposits });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách đặt cọc.", error = ex.Message });
            }
        }

        [HttpGet("{id}/transactions")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetTransactions(Guid id)
        {
            try
            {
                var deposit = await _context.Deposits
                    .Include(d => d.Contract)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (deposit == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy khoản đặt cọc." });
                }

                var (userId, role, isValid) = GetUserClaims();
                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null || deposit.Contract?.TenantId != tenant.Id)
                    {
                        return Forbid();
                    }
                }

                var transactions = await _context.DepositTransactions
                    .Where(t => t.DepositId == id)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        t.Id,
                        t.DepositId,
                        t.Amount,
                        t.TransactionType,
                        t.Reason,
                        t.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = transactions });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy lịch sử giao dịch cọc.", error = ex.Message });
            }
        }

        public class TransactionDto
        {
            public decimal Amount { get; set; }
            public string Reason { get; set; } = string.Empty;
        }

        [HttpPost("{id}/refund")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> RefundDeposit(Guid id, [FromBody] TransactionDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var deposit = await _context.Deposits.FindAsync(id);
                if (deposit == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy khoản đặt cọc." });
                }

                if (dto.Amount <= 0)
                {
                    return BadRequest(new { success = false, message = "Số tiền hoàn trả phải lớn hơn 0." });
                }

                if (deposit.RemainingBalance < dto.Amount)
                {
                    return BadRequest(new { success = false, message = "Số dư tiền cọc còn lại không đủ để hoàn trả." });
                }

                deposit.RemainingBalance -= dto.Amount;
                if (deposit.RemainingBalance == 0)
                {
                    deposit.Status = "REFUNDED";
                }
                else
                {
                    deposit.Status = "PARTIALLY_REFUNDED";
                }
                deposit.UpdatedAt = DateTimeOffset.UtcNow;

                var depositTransaction = new DepositTransaction
                {
                    DepositId = deposit.Id,
                    Amount = dto.Amount,
                    TransactionType = "REFUND",
                    Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Hoàn trả tiền đặt cọc" : dto.Reason,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _context.DepositTransactions.Add(depositTransaction);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Đã hoàn trả tiền đặt cọc thành công.", data = deposit });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi hoàn trả cọc.", error = ex.Message });
            }
        }

        [HttpPost("{id}/deduct")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> DeductDeposit(Guid id, [FromBody] TransactionDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var deposit = await _context.Deposits.FindAsync(id);
                if (deposit == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy khoản đặt cọc." });
                }

                if (dto.Amount <= 0)
                {
                    return BadRequest(new { success = false, message = "Số tiền phạt/trừ cọc phải lớn hơn 0." });
                }

                if (deposit.RemainingBalance < dto.Amount)
                {
                    return BadRequest(new { success = false, message = "Số dư tiền cọc còn lại không đủ để phạt/khấu trừ." });
                }

                deposit.RemainingBalance -= dto.Amount;
                deposit.Status = deposit.RemainingBalance == 0 ? "DEDUCTED_ALL" : "PARTIALLY_DEDUCTED";
                deposit.UpdatedAt = DateTimeOffset.UtcNow;

                var depositTransaction = new DepositTransaction
                {
                    DepositId = deposit.Id,
                    Amount = dto.Amount,
                    TransactionType = "DEDUCT",
                    Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Khấu trừ/Phạt tiền đặt cọc" : dto.Reason,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _context.DepositTransactions.Add(depositTransaction);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Đã phạt/khấu trừ tiền đặt cọc thành công.", data = deposit });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi phạt/khấu trừ tiền đặt cọc.", error = ex.Message });
            }
        }
    }
}
