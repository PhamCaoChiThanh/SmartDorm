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
    [Route("api/requests")]
    public class RequestController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RequestController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> GetAllRequests()
        {
            try
            {
                var requests = await _context.RoomRequests
                    .Include(r => r.Tenant)
                    .Include(r => r.Room)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.Id,
                        r.TenantId,
                        tenant_name = r.Tenant != null ? r.Tenant.FullName : string.Empty,
                        r.RoomId,
                        room_number = r.Room != null ? r.Room.RoomNumber : string.Empty,
                        move_in_date = r.MoveInDate,
                        r.Note,
                        status = r.Status.ToString(),
                        admin_note = r.AdminNote,
                        r.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = requests });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách yêu cầu thuê phòng", error = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize(Roles = "TENANT")]
        public async Task<IActionResult> GetMyRequests()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                if (userIdClaim == null) return Unauthorized();
                var userId = Guid.Parse(userIdClaim.Value);
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null) return Ok(new { success = true, data = new List<object>() });

                var requests = await _context.RoomRequests
                    .Include(r => r.Room)
                    .Where(r => r.TenantId == tenant.Id)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.Id,
                        room_number = r.Room != null ? r.Room.RoomNumber : string.Empty,
                        move_in_date = r.MoveInDate,
                        r.Note,
                        status = r.Status.ToString(),
                        admin_note = r.AdminNote,
                        r.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = requests });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy yêu cầu của bạn", error = ex.Message });
            }
        }

        public class CreateRequestDto
        {
            public Guid RoomId { get; set; }
            public string? MoveInDate { get; set; }
            public string? Note { get; set; }
        }

        [HttpPost]
        [Authorize(Roles = "TENANT")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateRequestDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                if (userIdClaim == null) return Unauthorized();
                var userId = Guid.Parse(userIdClaim.Value);

                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin sinh viên. Vui lòng cập nhật hồ sơ trước." });

                var room = await _context.Rooms.FindAsync(dto.RoomId);
                if (room == null)
                    return NotFound(new { success = false, message = "Phòng không tồn tại." });

                if (room.Status == RoomStatus.OCCUPIED)
                    return BadRequest(new { success = false, message = "Phòng này hiện đã được thuê." });

                // Check if tenant already has a pending request for this room
                var exists = await _context.RoomRequests.AnyAsync(r =>
                    r.TenantId == tenant.Id && r.RoomId == dto.RoomId && r.Status == RequestStatus.PENDING);
                if (exists)
                    return BadRequest(new { success = false, message = "Bạn đã có yêu cầu đang chờ duyệt cho phòng này." });

                DateOnly? moveInDate = null;
                if (!string.IsNullOrEmpty(dto.MoveInDate) && DateOnly.TryParse(dto.MoveInDate, out var parsedDate))
                    moveInDate = parsedDate;

                var request = new RoomRequest
                {
                    TenantId = tenant.Id,
                    RoomId = dto.RoomId,
                    MoveInDate = moveInDate,
                    Note = dto.Note,
                    Status = RequestStatus.PENDING
                };

                _context.RoomRequests.Add(request);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { success = true, message = "Gửi yêu cầu thuê phòng thành công! Admin sẽ xét duyệt sớm.", data = new { request.Id, status = request.Status.ToString() } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi gửi yêu cầu", error = ex.Message });
            }
        }

        public class HandleRequestDto
        {
            public string Status { get; set; } = string.Empty;
            public string? AdminNote { get; set; }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> HandleRequest(Guid id, [FromBody] HandleRequestDto dto)
        {
            if (!Enum.TryParse<RequestStatus>(dto.Status, true, out var requestStatus))
            {
                return BadRequest(new { success = false, message = "Trạng thái không hợp lệ. Phải là APPROVED hoặc REJECTED." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.RoomRequests.FindAsync(id);
                if (request == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy yêu cầu thuê phòng." });
                }

                if (request.Status != RequestStatus.PENDING)
                {
                    return BadRequest(new { success = false, message = "Yêu cầu này đã được xử lý từ trước." });
                }

                request.Status = requestStatus;
                request.AdminNote = dto.AdminNote;
                request.UpdatedAt = DateTimeOffset.UtcNow;

                if (requestStatus == RequestStatus.APPROVED && request.TenantId != null && request.RoomId != null)
                {
                    // Verify room is still available
                    var room = await _context.Rooms.FindAsync(request.RoomId);
                    if (room == null)
                    {
                        return BadRequest(new { success = false, message = "Phòng không tồn tại." });
                    }
                    if (room.Status == RoomStatus.OCCUPIED)
                    {
                        return BadRequest(new { success = false, message = "Phòng này hiện đã được thuê bởi người khác." });
                    }

                    // Create Contract
                    var contract = new Contract
                    {
                        TenantId = request.TenantId,
                        RoomId = request.RoomId,
                        StartDate = request.MoveInDate ?? DateOnly.FromDateTime(DateTime.Today),
                        EndDate = (request.MoveInDate ?? DateOnly.FromDateTime(DateTime.Today)).AddMonths(12), // default 1 year
                        Status = ContractStatus.ACTIVE
                    };
                    _context.Contracts.Add(contract);

                    // Update room status
                    room.Status = RoomStatus.OCCUPIED;
                    room.UpdatedAt = DateTimeOffset.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = $"Đã xử lý yêu cầu thành công ({requestStatus})", data = request });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi xử lý yêu cầu", error = ex.Message });
            }
        }
    }
}
