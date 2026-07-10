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
    [Route("api/utilities")]
    public class UtilityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UtilityController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,MANAGER")]
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
        [Authorize(Roles = "ADMIN,MANAGER")]
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
        [Authorize(Roles = "ADMIN,MANAGER")]
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
        [Authorize(Roles = "ADMIN,MANAGER")]
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
        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            try
            {
                var rooms = await _context.Rooms.ToListAsync();
                
                var allUsages = await _context.UtilityUsages
                    .OrderBy(u => u.BillingYear)
                    .ThenBy(u => u.BillingMonth)
                    .ToListAsync();

                var result = rooms.Select(room =>
                {
                    var roomUsages = allUsages.Where(u => u.RoomId == room.Id).ToList();
                    
                    var waterHistory = roomUsages.Where(u => u.Type == UtilityType.WATER)
                        .Select(u => new { month = u.BillingMonth, year = u.BillingYear, consumption = u.NewIndex - u.OldIndex })
                        .ToList();
                    
                    var electricHistory = roomUsages.Where(u => u.Type == UtilityType.ELECTRIC)
                        .Select(u => new { month = u.BillingMonth, year = u.BillingYear, consumption = u.NewIndex - u.OldIndex })
                        .ToList();

                    // Calculate anomaly for Water (latest vs avg of last 3 prior months)
                    bool isWaterAnomaly = false;
                    double waterAnomalyFactor = 1.0;
                    string? waterAnomalyMessage = null;
                    if (waterHistory.Count >= 2)
                    {
                        var latestWater = waterHistory.Last();
                        var prevWater = waterHistory.SkipLast(1).TakeLast(3).ToList();
                        if (prevWater.Count > 0)
                        {
                            var avgPrevWater = prevWater.Average(w => w.consumption);
                            if (avgPrevWater > 0 && latestWater.consumption > 2 * avgPrevWater && latestWater.consumption > 10)
                            {
                                isWaterAnomaly = true;
                                waterAnomalyFactor = Math.Round((double)latestWater.consumption / avgPrevWater, 1);
                                waterAnomalyMessage = $"Cảnh báo rò rỉ nước: Tiêu thụ tháng này ({latestWater.consumption} m³) tăng gấp {waterAnomalyFactor} lần so với trung bình các tháng trước ({Math.Round(avgPrevWater, 1)} m³).";
                            }
                        }
                    }

                    // Calculate anomaly for Electricity (latest vs avg of last 3 prior months)
                    bool isElectricAnomaly = false;
                    double electricAnomalyFactor = 1.0;
                    string? electricAnomalyMessage = null;
                    if (electricHistory.Count >= 2)
                    {
                        var latestElectric = electricHistory.Last();
                        var prevElectric = electricHistory.SkipLast(1).TakeLast(3).ToList();
                        if (prevElectric.Count > 0)
                        {
                            var avgPrevElectric = prevElectric.Average(e => e.consumption);
                            if (avgPrevElectric > 0 && latestElectric.consumption > 2 * avgPrevElectric && latestElectric.consumption > 50)
                            {
                                isElectricAnomaly = true;
                                electricAnomalyFactor = Math.Round((double)latestElectric.consumption / avgPrevElectric, 1);
                                electricAnomalyMessage = $"Cảnh báo rò điện: Tiêu thụ tháng này ({latestElectric.consumption} kWh) tăng gấp {electricAnomalyFactor} lần so với trung bình các tháng trước ({Math.Round(avgPrevElectric, 1)} kWh).";
                            }
                        }
                    }

                    return new
                    {
                        roomId = room.Id,
                        roomNumber = room.RoomNumber,
                        waterAnalytics = new
                        {
                            history = waterHistory,
                            isAnomaly = isWaterAnomaly,
                            anomalyFactor = waterAnomalyFactor,
                            message = waterAnomalyMessage
                        },
                        electricAnalytics = new
                        {
                            history = electricHistory,
                            isAnomaly = isElectricAnomaly,
                            anomalyFactor = electricAnomalyFactor,
                            message = electricAnomalyMessage
                        }
                    };
                }).ToList();

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi phân tích dữ liệu điện nước", error = ex.Message });
            }
        }
    }
}
