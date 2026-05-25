using System;
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
    [Route("api/rooms")]
    public class RoomController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoomController(AppDbContext context)
        {
            _context = context;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllRooms()
        {
            try
            {
                var rooms = await _context.Rooms.OrderBy(r => r.RoomNumber).ToListAsync();
                return Ok(new { success = true, data = rooms });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách phòng", error = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRoomById(Guid id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phòng" });
                }
                return Ok(new { success = true, data = room });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy thông tin phòng", error = ex.Message });
            }
        }

        public class CreateRoomDto
        {
            public string RoomNumber { get; set; } = string.Empty;
            public int Capacity { get; set; }
            public decimal BasePrice { get; set; }
            public decimal? GarbageFee { get; set; }
            public decimal ElectricityPrice { get; set; }
            public decimal WaterPrice { get; set; }
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto dto)
        {
            try
            {
                var room = new Room
                {
                    RoomNumber = dto.RoomNumber,
                    Capacity = dto.Capacity,
                    BasePrice = dto.BasePrice,
                    GarbageFee = dto.GarbageFee ?? 0,
                    ElectricityPrice = dto.ElectricityPrice,
                    WaterPrice = dto.WaterPrice,
                    Status = RoomStatus.AVAILABLE
                };

                _context.Rooms.Add(room);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { success = true, message = "Thêm phòng thành công", data = room });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi thêm phòng", error = ex.Message });
            }
        }

        public class UpdateRoomDto
        {
            public string RoomNumber { get; set; } = string.Empty;
            public int Capacity { get; set; }
            public string Status { get; set; } = string.Empty;
            public decimal BasePrice { get; set; }
            public decimal GarbageFee { get; set; }
            public decimal ElectricityPrice { get; set; }
            public decimal WaterPrice { get; set; }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> UpdateRoom(Guid id, [FromBody] UpdateRoomDto dto)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phòng để cập nhật" });
                }

                if (Enum.TryParse<RoomStatus>(dto.Status, true, out var status))
                {
                    room.Status = status;
                }

                room.RoomNumber = dto.RoomNumber;
                room.Capacity = dto.Capacity;
                room.BasePrice = dto.BasePrice;
                room.GarbageFee = dto.GarbageFee;
                room.ElectricityPrice = dto.ElectricityPrice;
                room.WaterPrice = dto.WaterPrice;
                room.UpdatedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật phòng thành công", data = room });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật phòng", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> DeleteRoom(Guid id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phòng để xóa" });
                }

                // Check if any contracts refer to this room
                var hasContract = await _context.Contracts.AnyAsync(c => c.RoomId == id);
                if (hasContract)
                {
                    return BadRequest(new { success = false, message = "Lỗi khi xóa phòng (Lưu ý: Không thể xóa phòng đã có hợp đồng)" });
                }

                _context.Rooms.Remove(room);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa phòng thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa phòng", error = ex.Message });
            }
        }
    }
}
