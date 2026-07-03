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
    [Route("api/vehicles")]
    public class VehicleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VehicleController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetAllVehicles()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirst("role");

                if (userIdClaim == null || roleClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh." });
                }

                var userId = Guid.Parse(userIdClaim.Value);
                var role = roleClaim.Value;

                var query = _context.Vehicles
                    .Include(v => v.Tenant)
                    .AsQueryable();

                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null)
                    {
                        return Ok(new { success = true, data = new List<object>() });
                    }
                    query = query.Where(v => v.TenantId == tenant.Id);
                }

                var vehicles = await query
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
            public Guid? TenantId { get; set; }
            public string LicensePlate { get; set; } = string.Empty;
            public string? VehicleModel { get; set; }
            public string Type { get; set; } = string.Empty;
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> RegisterVehicle([FromBody] RegisterVehicleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.LicensePlate))
            {
                return BadRequest(new { success = false, message = "Biển số xe không được để trống." });
            }

            // Map Vietnamese or English vehicle type to enum
            string typeStr = dto.Type.ToUpper().Trim();
            if (typeStr == "XE MÁY" || typeStr == "MOTORBIKE") typeStr = "MOTORBIKE";
            else if (typeStr == "XE ĐẠP" || typeStr == "BICYCLE") typeStr = "BICYCLE";
            else if (typeStr == "Ô TÔ" || typeStr == "CAR") typeStr = "CAR";

            if (!Enum.TryParse<VehicleType>(typeStr, true, out var vehicleType))
            {
                return BadRequest(new { success = false, message = "Loại xe không hợp lệ (BICYCLE, MOTORBIKE, CAR)." });
            }

            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirst("role");

                if (userIdClaim == null || roleClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh." });
                }

                var userId = Guid.Parse(userIdClaim.Value);
                var role = roleClaim.Value;

                Guid finalTenantId = dto.TenantId ?? Guid.Empty;

                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null)
                    {
                        return BadRequest(new { success = false, message = "Bạn chưa hoàn tất cập nhật hồ sơ sinh viên." });
                    }
                    finalTenantId = tenant.Id;
                }
                else
                {
                    if (finalTenantId == Guid.Empty)
                    {
                        return BadRequest(new { success = false, message = "TenantId không được để trống đối với Admin/Manager." });
                    }
                }

                // Verify tenant exists
                var tenantExists = await _context.Tenants.AnyAsync(t => t.Id == finalTenantId);
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
                    TenantId = finalTenantId,
                    LicensePlate = dto.LicensePlate,
                    VehicleModel = dto.VehicleModel,
                    Type = vehicleType
                };

                _context.Vehicles.Add(vehicle);
                await _context.SaveChangesAsync();

                // Auto-create an APPROVED Monthly Parking Registration for this vehicle
                decimal fee = 150000; // default for motorbike
                if (vehicleType == VehicleType.BICYCLE) fee = 50000;
                else if (vehicleType == VehicleType.CAR) fee = 500000;

                var registration = new ParkingRegistration
                {
                    VehicleId = vehicle.Id,
                    TenantId = finalTenantId,
                    TicketType = ParkingTicketType.MONTHLY,
                    StartDate = DateOnly.FromDateTime(DateTime.Today),
                    FeePerPeriod = fee,
                    Status = RequestStatus.APPROVED, // auto-approve parking registration when vehicle is registered
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };
                _context.ParkingRegistrations.Add(registration);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { success = true, message = "Đăng ký xe & đăng ký gửi xe thành công", data = vehicle });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi đăng ký xe", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> RemoveVehicle(Guid id)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy xe để xóa." });
                }

                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role) ?? User.FindFirst("role");

                if (userIdClaim == null || roleClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh." });
                }

                var userId = Guid.Parse(userIdClaim.Value);
                var role = roleClaim.Value;

                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null || vehicle.TenantId != tenant.Id)
                    {
                        return Unauthorized(new { success = false, message = "Bạn không có quyền xóa phương tiện này." });
                    }
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
