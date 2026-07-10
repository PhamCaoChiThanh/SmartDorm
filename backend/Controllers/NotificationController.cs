using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
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
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationController(AppDbContext context)
        {
            _context = context;
        }

        // Helper to get current user ID from claims
        private Guid GetCurrentUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
            {
                userIdString = User.FindFirst("id")?.Value;
                if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out userId))
                {
                    return userId;
                }
                throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");
            }
            return userId;
        }

        // 1. GET /api/notifications - Get all notifications for current user
        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var notifications = await _context.Notifications
                    .Include(n => n.Sender)
                    .Where(n => n.RecipientId == currentUserId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(50) // Limit to 50 recent notifications
                    .ToListAsync();

                var tenants = await _context.Tenants.ToListAsync();

                var result = notifications.Select(n =>
                {
                    var tenant = tenants.FirstOrDefault(t => t.UserId == n.SenderId);
                    string senderName = tenant != null ? tenant.FullName : (n.Sender?.Username ?? "Ẩn danh");

                    return new
                    {
                        n.Id,
                        n.RecipientId,
                        n.SenderId,
                        sender_name = senderName,
                        sender_avatar = n.Sender?.AvatarUrl,
                        n.Type,
                        n.PostId,
                        n.CommentId,
                        n.Content,
                        n.IsRead,
                        n.CreatedAt
                    };
                }).ToList();

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách thông báo", error = ex.Message });
            }
        }

        // 2. GET /api/notifications/unread-count - Get count of unread notifications
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var unreadCount = await _context.Notifications
                    .CountAsync(n => n.RecipientId == currentUserId && !n.IsRead);

                return Ok(new { success = true, data = new { unread_count = unreadCount } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy số thông báo chưa đọc", error = ex.Message });
            }
        }

        // 3. POST /api/notifications/{id}/read - Mark a notification as read
        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var notification = await _context.Notifications.FindAsync(id);

                if (notification == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy thông báo." });
                }

                if (notification.RecipientId != currentUserId)
                {
                    return StatusCode(403, new { success = false, message = "Bạn không có quyền cập nhật thông báo này." });
                }

                notification.IsRead = true;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đã đánh dấu đã đọc." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi đánh dấu thông báo", error = ex.Message });
            }
        }

        // 4. POST /api/notifications/read-all - Mark all notifications as read
        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var unreadNotifications = await _context.Notifications
                    .Where(n => n.RecipientId == currentUserId && !n.IsRead)
                    .ToListAsync();

                foreach (var n in unreadNotifications)
                {
                    n.IsRead = true;
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đã đánh dấu đã đọc tất cả thông báo." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi đánh dấu đọc tất cả thông báo", error = ex.Message });
            }
        }

        // 5. DELETE /api/notifications/{id} - Delete a notification
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var notification = await _context.Notifications.FindAsync(id);

                if (notification == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy thông báo." });
                }

                if (notification.RecipientId != currentUserId)
                {
                    return StatusCode(403, new { success = false, message = "Bạn không có quyền xóa thông báo này." });
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa thông báo thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa thông báo", error = ex.Message });
            }
        }
    }
}
