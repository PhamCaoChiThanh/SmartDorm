using System;
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
    [Route("api/tenants")]
    public class TenantController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TenantController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTenants()
        {
            try
            {
                var tenants = await _context.Tenants.OrderByDescending(t => t.CreatedAt).ToListAsync();
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
    }
}
