using System;
using System.Collections.Generic;
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
    [Route("api/tenants")]
    public class TenantController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TenantController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "ADMIN,MANAGER")]
        [HttpGet]
        public async Task<IActionResult> GetAllTenants()
        {
            try
            {
                var tenants = await _context.Tenants
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        t.Id,
                        t.FullName,
                        t.Cccd,
                        t.Phone,
                        t.Email,
                        t.CreatedAt,
                        t.UpdatedAt,
                        room_number = _context.Contracts
                            .Where(c => c.TenantId == t.Id && c.Status == ContractStatus.ACTIVE)
                            .Select(c => c.Room != null ? c.Room.RoomNumber : string.Empty)
                            .FirstOrDefault() ?? string.Empty
                    })
                    .ToListAsync();
                return Ok(new { success = true, data = tenants });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách sinh viên", error = ex.Message });
            }
        }

        public class CreateTenantDto
        {
            public string FullName { get; set; } = string.Empty;
            public string Cccd { get; set; } = string.Empty;
            public string? Phone { get; set; }
            public string? Email { get; set; }
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [Authorize(Roles = "ADMIN,MANAGER")]
        [HttpPost]
        public async Task<IActionResult> CreateTenant([FromBody] CreateTenantDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName) ||
                string.IsNullOrWhiteSpace(dto.Cccd) ||
                string.IsNullOrWhiteSpace(dto.Username) ||
                string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { success = false, message = "Các thông tin FullName, Cccd, Username, Password không được để trống." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Cccd.Trim(), @"^\d{12}$"))
            {
                return BadRequest(new { success = false, message = "Số CCCD phải có đúng 12 chữ số." });
            }

            if (!string.IsNullOrEmpty(dto.Phone) && !System.Text.RegularExpressions.Regex.IsMatch(dto.Phone.Trim(), @"^\d{10}$"))
            {
                return BadRequest(new { success = false, message = "Số điện thoại phải có đúng 10 chữ số." });
            }

            if (!string.IsNullOrEmpty(dto.Email) && !System.Text.RegularExpressions.Regex.IsMatch(dto.Email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                return BadRequest(new { success = false, message = "Địa chỉ email không đúng định dạng." });
            }

            if (dto.Password.Length < 6)
            {
                return BadRequest(new { success = false, message = "Mật khẩu phải có ít nhất 6 ký tự." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[A-Z]"))
            {
                return BadRequest(new { success = false, message = "Mật khẩu phải chứa ít nhất 1 chữ cái in hoa." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[a-z]"))
            {
                return BadRequest(new { success = false, message = "Mật khẩu phải chứa ít nhất 1 chữ cái thường." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[0-9]"))
            {
                return BadRequest(new { success = false, message = "Mật khẩu phải chứa ít nhất 1 chữ số." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[^A-Za-z0-9]"))
            {
                return BadRequest(new { success = false, message = "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Check if user or tenant already exists
                var userExists = await _context.Users.AnyAsync(u => u.Username == dto.Username || u.Email == dto.Email);
                if (userExists)
                {
                    return BadRequest(new { success = false, message = "Username hoặc Email của tài khoản đã tồn tại." });
                }

                var cccdExists = await _context.Tenants.AnyAsync(t => t.Cccd == dto.Cccd);
                if (cccdExists)
                {
                    return BadRequest(new { success = false, message = "Số CCCD này đã được đăng ký." });
                }

                // 2. Hash password using BCrypt
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

                // 3. Create User record
                var user = new User
                {
                    Username = dto.Username,
                    Email = dto.Email,
                    PasswordHash = passwordHash,
                    Role = UserRole.TENANT
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // 4. Create Tenant record linked to the User
                var tenant = new Tenant
                {
                    UserId = user.Id,
                    FullName = dto.FullName,
                    Cccd = dto.Cccd,
                    Phone = dto.Phone,
                    Email = dto.Email
                };

                _context.Tenants.Add(tenant);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return StatusCode(201, new
                {
                    success = true,
                    message = "Thêm sinh viên thành công",
                    data = tenant
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi thêm sinh viên", error = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh người dùng." });
                }

                var userId = Guid.Parse(userIdClaim.Value);
                var tenant = await _context.Tenants
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.UserId == userId);

                if (tenant == null)
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user == null)
                    {
                        return NotFound(new { success = false, message = "Không tìm thấy tài khoản người dùng." });
                    }

                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            id = Guid.Empty,
                            fullName = user.Username,
                            cccd = "",
                            phone = "",
                            email = user.Email,
                            avatar_url = user.AvatarUrl,
                            room = (object?)null,
                            contract = (object?)null,
                            invoices = new List<object>(),
                            requests = new List<object>()
                        }
                    });
                }

                var contract = await _context.Contracts
                    .Include(c => c.Room)
                    .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && c.Status == ContractStatus.ACTIVE);

                var deposit = contract != null 
                    ? await _context.Deposits.FirstOrDefaultAsync(d => d.ContractId == contract.Id)
                    : null;

                var invoices = new List<Invoice>();
                if (contract != null)
                {
                    invoices = await _context.Invoices
                        .Where(i => i.ContractId == contract.Id)
                        .OrderByDescending(i => i.BillingYear)
                        .ThenByDescending(i => i.BillingMonth)
                        .ToListAsync();
                }

                var requests = await _context.RoomRequests
                    .Include(r => r.Room)
                    .Where(r => r.TenantId == tenant.Id)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        roomNumber = r.Room != null ? r.Room.RoomNumber : string.Empty,
                        status = r.Status.ToString(),
                        createdAt = r.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = tenant.Id,
                        fullName = tenant.FullName,
                        cccd = tenant.Cccd,
                        phone = tenant.Phone,
                        email = tenant.Email,
                        avatar_url = tenant.User?.AvatarUrl,
                        room = contract?.Room != null ? new
                        {
                            id = contract.Room.Id,
                            roomNumber = contract.Room.RoomNumber,
                            capacity = contract.Room.Capacity,
                            status = contract.Room.Status.ToString(),
                            basePrice = contract.Room.BasePrice,
                            garbageFee = contract.Room.GarbageFee,
                            electricityPrice = contract.Room.ElectricityPrice,
                            waterPrice = contract.Room.WaterPrice
                        } : null,
                        contract = contract != null ? new
                        {
                            id = contract.Id,
                            startDate = contract.StartDate,
                            endDate = contract.EndDate,
                            status = contract.Status.ToString(),
                            deposit = deposit != null ? new
                            {
                                totalAmount = deposit.TotalAmount,
                                remainingBalance = deposit.RemainingBalance,
                                status = deposit.Status
                            } : null
                        } : null,
                        invoices = invoices.Select(i => new
                        {
                            id = i.Id,
                            billingMonth = i.BillingMonth,
                            billingYear = i.BillingYear,
                            roomFee = i.RoomFee,
                            electricFee = i.ElectricFee,
                            waterFee = i.WaterFee,
                            totalAmount = i.TotalAmount,
                            paidAmount = i.PaidAmount,
                            status = i.Status.ToString(),
                            createdAt = i.CreatedAt
                        }).ToList(),
                        requests = requests
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy thông tin hồ sơ", error = ex.Message });
            }
        }

        public class UpdateTenantProfileDto
        {
            public string FullName { get; set; } = string.Empty;
            public string Cccd { get; set; } = string.Empty;
            public string? Phone { get; set; }
            public string? Email { get; set; }
            public string? AvatarUrl { get; set; }
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateTenantProfileDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(new { success = false, message = "Họ và tên không được để trống." });
            }

            if (string.IsNullOrWhiteSpace(dto.Cccd) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Cccd.Trim(), @"^\d{12}$"))
            {
                return BadRequest(new { success = false, message = "Số CCCD phải có đúng 12 chữ số." });
            }

            if (string.IsNullOrWhiteSpace(dto.Phone) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Phone.Trim(), @"^\d{10}$"))
            {
                return BadRequest(new { success = false, message = "Số điện thoại phải có đúng 10 chữ số." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                return BadRequest(new { success = false, message = "Địa chỉ email không đúng định dạng." });
            }

            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin định danh người dùng." });
                }

                var userId = Guid.Parse(userIdClaim.Value);

                // 1. Check unique email (if modified)
                if (!string.IsNullOrEmpty(dto.Email))
                {
                    var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != userId);
                    if (emailExists)
                    {
                        return BadRequest(new { success = false, message = "Địa chỉ email này đã được sử dụng bởi tài khoản khác." });
                    }
                }

                // 2. Check unique CCCD (if modified)
                var cccdExists = await _context.Tenants.AnyAsync(t => t.Cccd == dto.Cccd && t.UserId != userId);
                if (cccdExists)
                {
                    return BadRequest(new { success = false, message = "Số CCCD này đã được đăng ký bởi tài khoản khác." });
                }

                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);

                // Update email in Users table too
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.Email = dto.Email;
                    user.AvatarUrl = dto.AvatarUrl;
                    user.UpdatedAt = DateTimeOffset.UtcNow;
                    _context.Users.Update(user);
                }

                if (tenant == null)
                {
                    // If tenant record does not exist, create it
                    tenant = new Tenant
                    {
                        UserId = userId,
                        FullName = dto.FullName,
                        Cccd = dto.Cccd,
                        Phone = dto.Phone,
                        Email = dto.Email,
                        CreatedAt = DateTimeOffset.UtcNow,
                        UpdatedAt = DateTimeOffset.UtcNow
                    };
                    _context.Tenants.Add(tenant);
                }
                else
                {
                    tenant.FullName = dto.FullName;
                    tenant.Cccd = dto.Cccd;
                    tenant.Phone = dto.Phone;
                    tenant.Email = dto.Email;
                    tenant.UpdatedAt = DateTimeOffset.UtcNow;
                    _context.Tenants.Update(tenant);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật hồ sơ thành công",
                    data = tenant
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật hồ sơ", error = ex.Message });
            }
        }

        [Authorize(Roles = "ADMIN,MANAGER")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTenant(Guid id, [FromBody] UpdateTenantProfileDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(new { success = false, message = "Họ và tên không được để trống." });
            }

            if (string.IsNullOrWhiteSpace(dto.Cccd) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Cccd.Trim(), @"^\d{12}$"))
            {
                return BadRequest(new { success = false, message = "Số CCCD phải có đúng 12 chữ số." });
            }

            if (string.IsNullOrWhiteSpace(dto.Phone) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Phone.Trim(), @"^\d{10}$"))
            {
                return BadRequest(new { success = false, message = "Số điện thoại phải có đúng 10 chữ số." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                return BadRequest(new { success = false, message = "Địa chỉ email không đúng định dạng." });
            }

            try
            {
                var tenant = await _context.Tenants.FindAsync(id);
                if (tenant == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người thuê." });
                }

                // Check unique Email
                if (!string.IsNullOrEmpty(dto.Email))
                {
                    var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != tenant.UserId);
                    if (emailExists)
                    {
                        return BadRequest(new { success = false, message = "Địa chỉ email này đã được sử dụng bởi tài khoản khác." });
                    }
                }

                // Check unique CCCD
                var cccdExists = await _context.Tenants.AnyAsync(t => t.Cccd == dto.Cccd && t.Id != id);
                if (cccdExists)
                {
                    return BadRequest(new { success = false, message = "Số CCCD này đã được đăng ký bởi người thuê khác." });
                }

                tenant.FullName = dto.FullName;
                tenant.Cccd = dto.Cccd;
                tenant.Phone = dto.Phone;
                tenant.Email = dto.Email;
                tenant.UpdatedAt = DateTimeOffset.UtcNow;
                _context.Tenants.Update(tenant);

                if (tenant.UserId != null)
                {
                    var user = await _context.Users.FindAsync(tenant.UserId);
                    if (user != null)
                    {
                        user.Email = dto.Email;
                        user.UpdatedAt = DateTimeOffset.UtcNow;
                        _context.Users.Update(user);
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật người thuê thành công",
                    data = tenant
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật người thuê", error = ex.Message });
            }
        }

        [Authorize(Roles = "ADMIN,MANAGER")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTenant(Guid id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var tenant = await _context.Tenants.FindAsync(id);
                if (tenant == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy người thuê." });
                }

                // Check active contracts
                var hasActiveContract = await _context.Contracts.AnyAsync(c => c.TenantId == id && c.Status == ContractStatus.ACTIVE);
                if (hasActiveContract)
                {
                    return BadRequest(new { success = false, message = "Không thể xóa người thuê đang có hợp đồng hoạt động." });
                }

                // 1. Delete dependent vehicles
                var vehicles = _context.Vehicles.Where(v => v.TenantId == id);
                _context.Vehicles.RemoveRange(vehicles);

                // 2. Delete dependent room requests
                var reqs = _context.RoomRequests.Where(r => r.TenantId == id);
                _context.RoomRequests.RemoveRange(reqs);

                // 3. Delete dependent maintenance reports
                var maints = _context.Maintenances.Where(m => m.ReportedBy == id);
                _context.Maintenances.RemoveRange(maints);

                // 4. Delete dependent contracts and their invoices/payments
                var contracts = await _context.Contracts.Where(c => c.TenantId == id).ToListAsync();
                foreach (var contract in contracts)
                {
                    var invoices = await _context.Invoices.Where(i => i.ContractId == contract.Id).ToListAsync();
                    foreach (var invoice in invoices)
                    {
                        var payments = _context.Payments.Where(p => p.InvoiceId == invoice.Id);
                        _context.Payments.RemoveRange(payments);
                    }
                    _context.Invoices.RemoveRange(invoices);
                }
                _context.Contracts.RemoveRange(contracts);

                // 5. Delete tenant
                _context.Tenants.Remove(tenant);

                // 6. Delete user account
                if (tenant.UserId != null)
                {
                    var user = await _context.Users.FindAsync(tenant.UserId);
                    if (user != null)
                    {
                        // Delete dependent audit logs of this user
                        var logs = _context.AuditLogs.Where(l => l.UserId == tenant.UserId);
                        _context.AuditLogs.RemoveRange(logs);

                        _context.Users.Remove(user);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = "Xóa người thuê thành công"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa người thuê", error = ex.Message });
            }
        }
    }
}
