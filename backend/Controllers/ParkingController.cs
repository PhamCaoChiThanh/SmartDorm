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
    [Route("api/parking")]
    public class ParkingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ParkingController(AppDbContext context)
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

        [HttpGet("registrations")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetRegistrations()
        {
            try
            {
                var (userId, role, isValid) = GetUserClaims();
                if (!isValid)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh." });
                }

                var query = _context.ParkingRegistrations
                    .Include(r => r.Vehicle)
                    .Include(r => r.Tenant)
                    .AsQueryable();

                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null)
                    {
                        return Ok(new { success = true, data = new List<object>() });
                    }
                    query = query.Where(r => r.TenantId == tenant.Id);
                }

                var registrations = await query
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.Id,
                        r.VehicleId,
                        license_plate = r.Vehicle != null ? r.Vehicle.LicensePlate : string.Empty,
                        vehicle_model = r.Vehicle != null ? r.Vehicle.VehicleModel : string.Empty,
                        vehicle_type = r.Vehicle != null ? r.Vehicle.Type.ToString() : string.Empty,
                        r.TenantId,
                        tenant_name = r.Tenant != null ? r.Tenant.FullName : string.Empty,
                        ticket_type = r.TicketType.ToString(),
                        r.StartDate,
                        r.EndDate,
                        r.FeePerPeriod,
                        r.Status,
                        r.CreatedAt,
                        r.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = registrations });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách đăng ký gửi xe.", error = ex.Message });
            }
        }

        public class RegisterParkingDto
        {
            public Guid VehicleId { get; set; }
            public string TicketType { get; set; } = "MONTHLY";
            public DateOnly StartDate { get; set; } = DateOnly.FromDateTime(DateTime.Today);
        }

        [HttpPost("registrations")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> CreateRegistration([FromBody] RegisterParkingDto dto)
        {
            try
            {
                var (userId, role, isValid) = GetUserClaims();
                if (!isValid)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh." });
                }

                var vehicle = await _context.Vehicles.FindAsync(dto.VehicleId);
                if (vehicle == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy phương tiện." });
                }

                Guid tenantId;
                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null)
                    {
                        return BadRequest(new { success = false, message = "Không tìm thấy thông tin sinh viên." });
                    }
                    if (vehicle.TenantId != tenant.Id)
                    {
                        return Forbid();
                    }
                    tenantId = tenant.Id;
                }
                else
                {
                    if (vehicle.TenantId == null)
                    {
                        return BadRequest(new { success = false, message = "Phương tiện không thuộc về sinh viên nào." });
                    }
                    tenantId = vehicle.TenantId.Value;
                }

                // Check existing active registration
                var activeReg = await _context.ParkingRegistrations
                    .FirstOrDefaultAsync(r => r.VehicleId == dto.VehicleId && r.Status == RequestStatus.APPROVED && r.EndDate == null);
                if (activeReg != null)
                {
                    return BadRequest(new { success = false, message = "Phương tiện này đã có đăng ký gửi xe đang hoạt động." });
                }

                // Calculate fee per period (Monthly/Daily) based on vehicle type
                decimal fee = 150000; // default for motorbike
                if (vehicle.Type == VehicleType.BICYCLE) fee = 50000;
                else if (vehicle.Type == VehicleType.CAR) fee = 500000;

                if (dto.TicketType.ToUpper() == "DAILY")
                {
                    fee = vehicle.Type == VehicleType.BICYCLE ? 2000 : (vehicle.Type == VehicleType.CAR ? 20000 : 5000);
                }

                var registration = new ParkingRegistration
                {
                    VehicleId = dto.VehicleId,
                    TenantId = tenantId,
                    TicketType = Enum.TryParse<ParkingTicketType>(dto.TicketType.ToUpper(), out var parsedType) ? parsedType : ParkingTicketType.MONTHLY,
                    StartDate = dto.StartDate,
                    FeePerPeriod = fee,
                    Status = RequestStatus.PENDING,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.ParkingRegistrations.Add(registration);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đã gửi yêu cầu đăng ký gửi xe.", data = registration });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi đăng ký gửi xe.", error = ex.Message });
            }
        }

        public class UpdateStatusDto
        {
            public string Status { get; set; } = "APPROVED";
        }

        [HttpPut("registrations/{id}/status")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> UpdateRegistrationStatus(Guid id, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                var registration = await _context.ParkingRegistrations
                    .Include(r => r.Vehicle)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (registration == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy yêu cầu đăng ký gửi xe." });
                }

                if (!Enum.TryParse<RequestStatus>(dto.Status.ToUpper(), out var status))
                {
                    return BadRequest(new { success = false, message = "Trạng thái không hợp lệ." });
                }

                registration.Status = status;
                registration.UpdatedAt = DateTimeOffset.UtcNow;

                if (status == RequestStatus.APPROVED)
                {
                    // Create first invoice if monthly
                    if (registration.TicketType == ParkingTicketType.MONTHLY)
                    {
                        var hasInvoice = await _context.ParkingInvoices
                            .AnyAsync(i => i.RegistrationId == registration.Id && i.BillingMonth == registration.StartDate.Month && i.BillingYear == registration.StartDate.Year);
                        
                        if (!hasInvoice)
                        {
                            var invoice = new ParkingInvoice
                            {
                                RegistrationId = registration.Id,
                                BillingMonth = registration.StartDate.Month,
                                BillingYear = registration.StartDate.Year,
                                Amount = registration.FeePerPeriod,
                                Status = InvoiceStatus.PENDING,
                                CreatedAt = DateTimeOffset.UtcNow,
                                UpdatedAt = DateTimeOffset.UtcNow
                            };
                            _context.ParkingInvoices.Add(invoice);
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = $"Đã cập nhật trạng thái yêu cầu gửi xe thành {status}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật trạng thái gửi xe.", error = ex.Message });
            }
        }

        [HttpGet("invoices")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> GetInvoices()
        {
            try
            {
                var (userId, role, isValid) = GetUserClaims();
                if (!isValid)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh." });
                }

                var query = _context.ParkingInvoices
                    .Include(i => i.Registration)
                        .ThenInclude(r => r!.Vehicle)
                    .Include(i => i.Registration)
                        .ThenInclude(r => r!.Tenant)
                    .AsQueryable();

                if (role == "TENANT")
                {
                    var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                    if (tenant == null)
                    {
                        return Ok(new { success = true, data = new List<object>() });
                    }
                    query = query.Where(i => i.Registration!.TenantId == tenant.Id);
                }

                var invoices = await query
                    .OrderByDescending(i => i.CreatedAt)
                    .Select(i => new
                    {
                        id = i.Id,
                        registration_id = i.RegistrationId,
                        plate = i.Registration != null && i.Registration.Vehicle != null ? i.Registration.Vehicle.LicensePlate : string.Empty,
                        type = i.Registration != null && i.Registration.Vehicle != null ? i.Registration.Vehicle.Type.ToString() : string.Empty,
                        ticketType = i.Registration != null ? i.Registration.TicketType.ToString() : string.Empty,
                        billingMonth = i.BillingMonth,
                        billingYear = i.BillingYear,
                        amount = i.Amount,
                        status = i.Status.ToString(),
                        created_at = i.CreatedAt,
                        updated_at = i.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = invoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách hóa đơn gửi xe.", error = ex.Message });
            }
        }

        public class PayInvoiceDto
        {
            public string PaymentMethod { get; set; } = "CASH";
            public decimal Amount { get; set; }
        }

        [HttpPost("invoices/{id}/pay")]
        [Authorize(Roles = "ADMIN,MANAGER,TENANT")]
        public async Task<IActionResult> PayInvoice(Guid id, [FromBody] PayInvoiceDto dto)
        {
            try
            {
                var invoice = await _context.ParkingInvoices.FindAsync(id);
                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn gửi xe." });
                }

                if (invoice.Status == InvoiceStatus.PAID)
                {
                    return BadRequest(new { success = false, message = "Hóa đơn này đã được thanh toán trước đó." });
                }

                var payment = new ParkingPayment
                {
                    ParkingInvoiceId = invoice.Id,
                    Amount = dto.Amount,
                    PaymentMethod = dto.PaymentMethod,
                    PaymentDate = DateTimeOffset.UtcNow
                };

                invoice.Status = InvoiceStatus.PAID;
                invoice.UpdatedAt = DateTimeOffset.UtcNow;

                _context.ParkingPayments.Add(payment);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Thanh toán hóa đơn gửi xe thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi thực hiện thanh toán hóa đơn.", error = ex.Message });
            }
        }
    }
}
