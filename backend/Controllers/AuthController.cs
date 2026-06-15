using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SmartDorm.Api.Data;
using SmartDorm.Api.Models;

namespace SmartDorm.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public class RegisterDto
        {
            public string Username { get; set; } = string.Empty;
            public string? Email { get; set; }
            public string Password { get; set; } = string.Empty;
            public string? Role { get; set; }
            public string? FullName { get; set; }
            public string? Cccd { get; set; }
            public string? Phone { get; set; }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Username và Password không được để trống." });
            }

            if (dto.Password.Length < 6)
            {
                return BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[A-Z]"))
            {
                return BadRequest(new { message = "Mật khẩu phải chứa ít nhất 1 chữ cái in hoa." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[a-z]"))
            {
                return BadRequest(new { message = "Mật khẩu phải chứa ít nhất 1 chữ cái thường." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[0-9]"))
            {
                return BadRequest(new { message = "Mật khẩu phải chứa ít nhất 1 chữ số." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[^A-Za-z0-9]"))
            {
                return BadRequest(new { message = "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt." });
            }

            // Parse role
            UserRole role = UserRole.TENANT;
            if (!string.IsNullOrEmpty(dto.Role) && Enum.TryParse<UserRole>(dto.Role, true, out var parsedRole))
            {
                role = parsedRole;
            }

            // Validate fields for TENANT
            if (role == UserRole.TENANT)
            {
                if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Cccd))
                {
                    return BadRequest(new { message = "Họ tên và CCCD không được để trống." });
                }

                if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Cccd.Trim(), @"^\d{12}$"))
                {
                    return BadRequest(new { message = "Số CCCD phải có đúng 12 chữ số." });
                }

                if (!string.IsNullOrEmpty(dto.Phone) && !System.Text.RegularExpressions.Regex.IsMatch(dto.Phone.Trim(), @"^\d{10}$"))
                {
                    return BadRequest(new { message = "Số điện thoại phải có đúng 10 chữ số." });
                }

                if (!string.IsNullOrEmpty(dto.Email) && !System.Text.RegularExpressions.Regex.IsMatch(dto.Email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                {
                    return BadRequest(new { message = "Địa chỉ email không đúng định dạng." });
                }
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Check existing user
                var existingUser = await _context.Users.AnyAsync(u => u.Username == dto.Username || u.Email == dto.Email);
                if (existingUser)
                {
                    return BadRequest(new { message = "Username hoặc Email đã tồn tại." });
                }

                if (role == UserRole.TENANT && !string.IsNullOrEmpty(dto.Cccd))
                {
                    var cccdExists = await _context.Tenants.AnyAsync(t => t.Cccd == dto.Cccd);
                    if (cccdExists)
                    {
                        return BadRequest(new { message = "Số CCCD này đã được đăng ký." });
                    }
                }

                // 2. Hash password
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

                var user = new User
                {
                    Username = dto.Username,
                    Email = dto.Email,
                    PasswordHash = passwordHash,
                    Role = role
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                if (role == UserRole.TENANT)
                {
                    var tenant = new Tenant
                    {
                        UserId = user.Id,
                        FullName = dto.FullName ?? string.Empty,
                        Cccd = dto.Cccd ?? string.Empty,
                        Phone = dto.Phone,
                        Email = dto.Email
                    };
                    _context.Tenants.Add(tenant);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return StatusCode(201, new
                {
                    message = "Đăng ký thành công.",
                    user = new
                    {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        role = user.Role.ToString()
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi server khi đăng ký.", error = ex.Message });
            }
        }

        public class LoginDto
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Username và Password không được để trống." });
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
                if (user == null)
                {
                    return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });
                }

                bool isMatch = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
                if (!isMatch)
                {
                    return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });
                }

                // Create JWT
                var jwtSecret = _config["Jwt:Secret"] ?? "your_super_secret_key_that_is_at_least_32_characters_long_here";
                var key = Encoding.ASCII.GetBytes(jwtSecret);

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, user.Username),
                        new Claim(ClaimTypes.Role, user.Role.ToString()),
                        new Claim("id", user.Id.ToString()),
                        new Claim("username", user.Username),
                        new Claim("role", user.Role.ToString())
                    }),
                    Expires = DateTime.UtcNow.AddDays(1),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                return Ok(new
                {
                    message = "Đăng nhập thành công.",
                    token = tokenString,
                    user = new
                    {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        role = user.Role.ToString()
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server khi đăng nhập.", error = ex.Message });
            }
        }
    }
}
