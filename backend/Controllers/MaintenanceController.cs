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
    [Authorize]
    [ApiController]
    [Route("api/maintenances")]
    public class MaintenanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaintenanceController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetAllMaintenances()
        {
            try
            {
                // If it's a tenant, only return their room's maintenances
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirst("role");

                var userId = Guid.Parse(userIdClaim!.Value);
                var role = roleClaim!.Value;

                var query = _context.Maintenances
                    .Include(m => m.Room)
                    .Include(m => m.Tenant)
                    .AsQueryable();

                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null)
                    {
                        return Ok(new { success = true, data = new List<object>() });
                    }
                    query = query.Where(m => m.ReportedBy == tenant.Id);
                }

                var reports = await query
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => new
                    {
                        m.Id,
                        m.RoomId,
                        room_number = m.Room != null ? m.Room.RoomNumber : string.Empty,
                        m.ReportedBy,
                        tenant_name = m.Tenant != null ? m.Tenant.FullName : string.Empty,
                        m.Description,
                        status = m.Status.ToString(),
                        m.AssignedTo,
                        m.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách báo hỏng", error = ex.Message });
            }
        }

        public class CreateMaintenanceDto
        {
            public string Description { get; set; } = string.Empty;
        }

        [HttpPost]
        [Authorize(Roles = "TENANT")]
        public async Task<IActionResult> ReportMaintenance([FromBody] CreateMaintenanceDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Description))
            {
                return BadRequest(new { success = false, message = "Mô tả sự cố không được để trống." });
            }

            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                var userId = Guid.Parse(userIdClaim!.Value);

                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null)
                {
                    return BadRequest(new { success = false, message = "Bạn chưa hoàn tất cập nhật hồ sơ sinh viên." });
                }

                // Get active contract to find room
                var contract = await _context.Contracts
                    .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && c.Status == ContractStatus.ACTIVE);

                if (contract == null || contract.RoomId == null)
                {
                    return BadRequest(new { success = false, message = "Bạn hiện tại chưa được xếp vào phòng nào." });
                }

                var report = new Maintenance
                {
                    RoomId = contract.RoomId,
                    ReportedBy = tenant.Id,
                    Description = dto.Description,
                    Status = MaintenanceStatus.OPEN,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.Maintenances.Add(report);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { success = true, message = "Gửi báo cáo sự cố thành công", data = report });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi gửi báo cáo sự cố", error = ex.Message });
            }
        }

        public class UpdateMaintenanceDto
        {
            public string Status { get; set; } = string.Empty;
            public string? AssignedTo { get; set; }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> UpdateMaintenance(Guid id, [FromBody] UpdateMaintenanceDto dto)
        {
            if (!Enum.TryParse<MaintenanceStatus>(dto.Status, true, out var mStatus))
            {
                return BadRequest(new { success = false, message = "Trạng thái không hợp lệ. Phải là OPEN, IN_PROGRESS, hoặc DONE." });
            }

            try
            {
                var report = await _context.Maintenances.FindAsync(id);
                if (report == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy báo cáo sự cố." });
                }

                report.Status = mStatus;
                report.AssignedTo = dto.AssignedTo;
                report.UpdatedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật trạng thái báo hỏng thành công", data = report });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật báo hỏng", error = ex.Message });
            }
        }
    }
}
