using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartDorm.Api.Data;
using SmartDorm.Api.Models;

namespace SmartDorm.Api.Controllers
{
    [Authorize(Roles = "ADMIN,MANAGER")]
    [ApiController]
    [Route("api/contracts")]
    public class ContractController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContractController(AppDbContext context)
        {
            _context = context;
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
                        start_date = c.StartDate,
                        end_date = c.EndDate,
                        c.Status,
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

                // 2. Update room status to OCCUPIED
                room.Status = RoomStatus.OCCUPIED;
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
                var contract = await _context.Contracts.FindAsync(id);
                if (contract == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hợp đồng" });
                }

                contract.Status = ContractStatus.TERMINATED;
                contract.UpdatedAt = DateTimeOffset.UtcNow;

                // 2. Update room status to AVAILABLE
                if (contract.RoomId != null)
                {
                    var room = await _context.Rooms.FindAsync(contract.RoomId);
                    if (room != null)
                    {
                        room.Status = RoomStatus.AVAILABLE;
                        room.UpdatedAt = DateTimeOffset.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

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
    }
}
