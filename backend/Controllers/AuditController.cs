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
    [Route("api/audit")]
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs()
        {
            try
            {
                var logs = await _context.AuditLogs
                    .Include(l => l.User)
                    .OrderByDescending(l => l.CreatedAt)
                    .Select(l => new
                    {
                        id = l.Id,
                        user = l.User != null ? l.User.Username : "Hệ thống",
                        action = l.Action,
                        entity = l.EntityName,
                        entityId = l.EntityId != null ? l.EntityId.ToString() : string.Empty,
                        oldValue = l.OldValue,
                        newValue = l.NewValue,
                        createdAt = l.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = logs });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy lịch sử hoạt động", error = ex.Message });
            }
        }
    }
}
