using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartDorm.Api.Data;
using SmartDorm.Api.Models;
using SmartDorm.Api.Services;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;

namespace SmartDorm.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/maintenances")]
    public class MaintenanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IServiceProvider _serviceProvider;

        public MaintenanceController(AppDbContext context, IEmailService emailService, IServiceProvider serviceProvider)
        {
            _context = context;
            _emailService = emailService;
            _serviceProvider = serviceProvider;
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

                    // Get active contract to find the tenant's room
                    var contract = await _context.Contracts
                        .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && c.Status == ContractStatus.ACTIVE);

                    if (contract != null && contract.RoomId != null)
                    {
                        query = query.Where(m => m.ReportedBy == tenant.Id || m.RoomId == contract.RoomId);
                    }
                    else
                    {
                        query = query.Where(m => m.ReportedBy == tenant.Id);
                    }
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
                        scheduled_for = m.ScheduledFor,
                        completed_at = m.CompletedAt,
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
            public Guid? RoomId { get; set; }
            public string? Status { get; set; }
            public string? AssignedTo { get; set; }
            public DateTimeOffset? ScheduledFor { get; set; }
            public DateTimeOffset? CompletedAt { get; set; }
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> ReportMaintenance([FromBody] CreateMaintenanceDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Description))
            {
                return BadRequest(new { success = false, message = "Mô tả sự cố không được để trống." });
            }

            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirst("role");
                
                var userId = Guid.Parse(userIdClaim!.Value);
                var role = roleClaim!.Value;

                Guid? roomId = null;
                Guid? reportedBy = null;

                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null)
                    {
                        return BadRequest(new { success = false, message = "Bạn chưa hoàn tất cập nhật hồ sơ sinh viên." });
                    }
                    reportedBy = tenant.Id;

                    // Get active contract to find room
                    var contract = await _context.Contracts
                        .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && c.Status == ContractStatus.ACTIVE);

                    if (contract == null || contract.RoomId == null)
                    {
                        return BadRequest(new { success = false, message = "Bạn hiện tại chưa được xếp vào phòng nào." });
                    }
                    roomId = contract.RoomId;
                }
                else
                {
                    if (dto.RoomId == null)
                    {
                        return BadRequest(new { success = false, message = "Phòng không được để trống." });
                    }
                    roomId = dto.RoomId;
                }

                var roomExists = await _context.Rooms.AnyAsync(r => r.Id == roomId);
                if (!roomExists)
                {
                    return BadRequest(new { success = false, message = "Không tìm thấy phòng tương ứng." });
                }

                var initialStatus = MaintenanceStatus.OPEN;
                if (!string.IsNullOrEmpty(dto.Status) && Enum.TryParse<MaintenanceStatus>(dto.Status, true, out var parsedStatus))
                {
                    initialStatus = parsedStatus;
                }

                var report = new Maintenance
                {
                    RoomId = roomId,
                    ReportedBy = reportedBy,
                    Description = dto.Description,
                    Status = initialStatus,
                    AssignedTo = dto.AssignedTo,
                    ScheduledFor = dto.ScheduledFor,
                    CompletedAt = initialStatus == MaintenanceStatus.DONE ? (dto.CompletedAt ?? DateTimeOffset.UtcNow) : null,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.Maintenances.Add(report);
                await _context.SaveChangesAsync();

                // Send email notification to room tenants
                if (report.RoomId.HasValue)
                {
                    SendMaintenanceNotification(report.RoomId.Value, report.Description, report.Status, report.AssignedTo, report.ScheduledFor, report.CompletedAt);
                }

                return StatusCode(201, new { success = true, message = "Gửi báo cáo sự cố thành công", data = report });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi gửi báo cáo sự cố", error = ex.Message });
            }
        }

        public class UpdateMaintenanceDto
        {
            public Guid? RoomId { get; set; }
            public string? Description { get; set; }
            public string Status { get; set; } = string.Empty;
            public string? AssignedTo { get; set; }
            public DateTimeOffset? ScheduledFor { get; set; }
            public DateTimeOffset? CompletedAt { get; set; }
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

                if (dto.RoomId != null)
                {
                    var roomExists = await _context.Rooms.AnyAsync(r => r.Id == dto.RoomId);
                    if (!roomExists)
                    {
                        return BadRequest(new { success = false, message = "Không tìm thấy phòng tương ứng." });
                    }
                    report.RoomId = dto.RoomId;
                }

                if (!string.IsNullOrEmpty(dto.Description))
                {
                    report.Description = dto.Description;
                }

                report.Status = mStatus;
                report.AssignedTo = dto.AssignedTo;
                report.ScheduledFor = dto.ScheduledFor;
                report.UpdatedAt = DateTimeOffset.UtcNow;

                if (mStatus == MaintenanceStatus.DONE)
                {
                    report.CompletedAt = dto.CompletedAt ?? report.CompletedAt ?? DateTimeOffset.UtcNow;
                }
                else
                {
                    report.CompletedAt = null;
                }

                await _context.SaveChangesAsync();

                // Send email notification to room tenants
                if (report.RoomId.HasValue)
                {
                    SendMaintenanceNotification(report.RoomId.Value, report.Description, report.Status, report.AssignedTo, report.ScheduledFor, report.CompletedAt);
                }

                return Ok(new { success = true, message = "Cập nhật trạng thái báo hỏng thành công", data = report });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật báo hỏng", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> DeleteMaintenance(Guid id)
        {
            try
            {
                var report = await _context.Maintenances.FindAsync(id);
                if (report == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy báo cáo sự cố." });
                }

                _context.Maintenances.Remove(report);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa báo cáo sự cố thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa báo cáo sự cố", error = ex.Message });
            }
        }

        private void SendMaintenanceNotification(Guid roomId, string? description, MaintenanceStatus status, string? assignedTo, DateTimeOffset? scheduledFor, DateTimeOffset? completedAt)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                        var room = await context.Rooms.FindAsync(roomId);
                        string roomNumber = room?.RoomNumber ?? "P-?";

                        var activeTenants = await context.Contracts
                            .Where(c => c.RoomId == roomId && c.Status == ContractStatus.ACTIVE)
                            .Include(c => c.Tenant)
                            .Select(c => c.Tenant)
                            .Where(t => t != null && !string.IsNullOrEmpty(t.Email))
                            .ToListAsync();

                        foreach (var tenant in activeTenants)
                        {
                            if (tenant == null || string.IsNullOrEmpty(tenant.Email))
                                continue;

                            string timeStr = scheduledFor.HasValue 
                                ? scheduledFor.Value.ToOffset(TimeSpan.FromHours(7)).ToString("dd/MM/yyyy HH:mm") 
                                : "Chưa lên lịch cụ thể";

                            string statusText = status == MaintenanceStatus.OPEN ? "Mở / Chờ xử lý" 
                                              : status == MaintenanceStatus.IN_PROGRESS ? "Đang xử lý" 
                                              : "Hoàn thành";

                            string completedLi = "";
                            if (status == MaintenanceStatus.DONE)
                            {
                                string completedTimeStr = completedAt.HasValue
                                    ? completedAt.Value.ToOffset(TimeSpan.FromHours(7)).ToString("dd/MM/yyyy HH:mm")
                                    : DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).ToString("dd/MM/yyyy HH:mm");
                                completedLi = $"<li><b>Thời gian hoàn thành:</b> {completedTimeStr}</li>";
                            }

                            string subject = $"[SmartDorm] Thông báo lịch bảo trì phòng {roomNumber}";
                             string body = $@"
                                <p>Xin chào <b>{tenant.FullName}</b>,</p>
                                <p>Ban quản lý ký túc xá SmartDorm thông báo về lịch bảo trì phòng của bạn:</p>
                                <ul>
                                    <li><b>Phòng:</b> {roomNumber}</li>
                                    <li><b>Nội dung sự cố:</b> {description ?? "Không có mô tả"}</li>
                                    <li><b>Thời gian bảo trì:</b> {timeStr}</li>
                                    <li><b>Người xử lý:</b> {assignedTo ?? "Chưa phân công"}</li>
                                    <li><b>Trạng thái:</b> {statusText}</li>
                                    {completedLi}
                                </ul>
                                <p>Vui lòng sắp xếp thời gian và tạo điều kiện để nhân viên kỹ thuật thực hiện nhiệm vụ.</p>
                                <p>Trân trọng,<br/>Ban quản lý SmartDorm</p>";

                            try
                            {
                                await emailService.SendEmailAsync(tenant.Email, subject, body);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error sending email to {tenant.Email}: {ex.Message}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in SendMaintenanceNotification: {ex.Message}");
                }
            });
        }
    }
}
