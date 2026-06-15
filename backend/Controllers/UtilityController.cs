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
    [Route("api/utilities")]
    public class UtilityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UtilityController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsages()
        {
            try
            {
                var usages = await _context.UtilityUsages
                    .Include(u => u.Room)
                    .OrderByDescending(u => u.BillingYear)
                    .ThenByDescending(u => u.BillingMonth)
                    .ThenBy(u => u.Room != null ? u.Room.RoomNumber : string.Empty)
                    .Select(u => new
                    {
                        u.Id,
                        u.RoomId,
                        room_number = u.Room != null ? u.Room.RoomNumber : string.Empty,
                        type = u.Type.ToString(),
                        billing_month = u.BillingMonth,
                        billing_year = u.BillingYear,
                        old_index = u.OldIndex,
                        new_index = u.NewIndex,
                        created_at = u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = usages });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy dữ liệu điện nước", error = ex.Message });
            }
        }

        public class RecordUsageDto
        {
            public Guid RoomId { get; set; }
            public string Type { get; set; } = string.Empty;
            public int BillingMonth { get; set; }
            public int BillingYear { get; set; }
            public int OldIndex { get; set; }
            public int NewIndex { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> RecordUsage([FromBody] RecordUsageDto dto)
        {
            if (!Enum.TryParse<UtilityType>(dto.Type, true, out var utilityType))
            {
                return BadRequest(new { success = false, message = "Loại tiện ích không hợp lệ. Phải là WATER hoặc ELECTRIC." });
            }

            if (dto.NewIndex < dto.OldIndex)
            {
                return BadRequest(new { success = false, message = "Chỉ số mới không được nhỏ hơn chỉ số cũ." });
            }

            try
            {
                // Verify room exists
                var roomExists = await _context.Rooms.AnyAsync(r => r.Id == dto.RoomId);
                if (!roomExists)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phòng." });
                }

                // Verify room has active contracts
                var hasActiveContract = await _context.Contracts.AnyAsync(c => c.RoomId == dto.RoomId && c.Status == ContractStatus.ACTIVE);
                if (!hasActiveContract)
                {
                    return BadRequest(new { success = false, message = "Không thể ghi nhận chỉ số cho phòng chưa có người thuê." });
                }

                // Verify not already recorded
                var alreadyExists = await _context.UtilityUsages.AnyAsync(uu =>
                    uu.RoomId == dto.RoomId &&
                    uu.Type == utilityType &&
                    uu.BillingMonth == dto.BillingMonth &&
                    uu.BillingYear == dto.BillingYear);

                if (alreadyExists)
                {
                    return BadRequest(new { success = false, message = $"Chỉ số {utilityType} cho tháng {dto.BillingMonth}/{dto.BillingYear} của phòng này đã được ghi nhận." });
                }

                var usage = new UtilityUsage
                {
                    RoomId = dto.RoomId,
                    Type = utilityType,
                    BillingMonth = dto.BillingMonth,
                    BillingYear = dto.BillingYear,
                    OldIndex = dto.OldIndex,
                    NewIndex = dto.NewIndex
                };

                _context.UtilityUsages.Add(usage);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { success = true, message = "Ghi nhận chỉ số thành công", data = usage });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi ghi nhận chỉ số điện nước", error = ex.Message });
            }
        }

        public class UpdateUtilityDto
        {
            public int OldIndex { get; set; }
            public int NewIndex { get; set; }
            public int BillingMonth { get; set; }
            public int BillingYear { get; set; }
            public string Type { get; set; } = string.Empty;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUsage(Guid id, [FromBody] UpdateUtilityDto dto)
        {
            if (!Enum.TryParse<UtilityType>(dto.Type, true, out var utilityType))
            {
                return BadRequest(new { success = false, message = "Loại tiện ích không hợp lệ. Phải là WATER hoặc ELECTRIC." });
            }

            if (dto.NewIndex < dto.OldIndex)
            {
                return BadRequest(new { success = false, message = "Chỉ số mới không được nhỏ hơn chỉ số cũ." });
            }

            try
            {
                var usage = await _context.UtilityUsages.FindAsync(id);
                if (usage == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy thông tin điện nước để cập nhật" });
                }

                usage.OldIndex = dto.OldIndex;
                usage.NewIndex = dto.NewIndex;
                usage.BillingMonth = dto.BillingMonth;
                usage.BillingYear = dto.BillingYear;
                usage.Type = utilityType;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật chỉ số thành công", data = usage });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật chỉ số điện nước", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsage(Guid id)
        {
            try
            {
                var usage = await _context.UtilityUsages.FindAsync(id);
                if (usage == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy thông tin điện nước để xóa" });
                }

                _context.UtilityUsages.Remove(usage);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa chỉ số thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa chỉ số điện nước", error = ex.Message });
            }
        }
    }
}
