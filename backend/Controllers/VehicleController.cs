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
    [Route("api/vehicles")]
    public class VehicleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VehicleController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllVehicles()
        {
            try
            {
                var vehicles = await _context.Vehicles
                    .Include(v => v.Tenant)
                    .OrderByDescending(v => v.CreatedAt)
                    .Select(v => new
                    {
                        v.Id,
                        v.TenantId,
                        owner_name = v.Tenant != null ? v.Tenant.FullName : string.Empty,
                        license_plate = v.LicensePlate,
                        vehicle_model = v.VehicleModel,
                        type = v.Type.ToString(),
                        v.CreatedAt,
                        v.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = vehicles });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách xe", error = ex.Message });
            }
        }

        public class RegisterVehicleDto
        {
            public Guid TenantId { get; set; }
            public string LicensePlate { get; set; } = string.Empty;
            public string? VehicleModel { get; set; }
            public string Type { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> RegisterVehicle([FromBody] RegisterVehicleDto dto)
        {
            if (!Enum.TryParse<VehicleType>(dto.Type, true, out var vehicleType))
            {
                return BadRequest(new { success = false, message = "Loại xe không hợp lệ (BICYCLE, MOTORBIKE, CAR)." });
            }

            if (string.IsNullOrWhiteSpace(dto.LicensePlate))
            {
                return BadRequest(new { success = false, message = "Biển số xe không được để trống." });
            }

            try
            {
                // Verify tenant exists
                var tenantExists = await _context.Tenants.AnyAsync(t => t.Id == dto.TenantId);
                if (!tenantExists)
                {
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin sinh viên." });
                }

                // Verify license plate uniqueness
                var exists = await _context.Vehicles.AnyAsync(v => v.LicensePlate == dto.LicensePlate);
                if (exists)
                {
                    return BadRequest(new { success = false, message = "Biển số xe này đã được đăng ký trên hệ thống." });
                }

                var vehicle = new Vehicle
                {
                    TenantId = dto.TenantId,
                    LicensePlate = dto.LicensePlate,
                    VehicleModel = dto.VehicleModel,
                    Type = vehicleType
                };

                _context.Vehicles.Add(vehicle);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { success = true, message = "Đăng ký xe thành công", data = vehicle });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi đăng ký xe", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveVehicle(Guid id)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy xe để xóa." });
                }

                _context.Vehicles.Remove(vehicle);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa xe thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa xe", error = ex.Message });
            }
        }
    }
}
