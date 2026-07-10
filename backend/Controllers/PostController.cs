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
    [Route("api/posts")]
    public class PostController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PostController(AppDbContext context)
        {
            _context = context;
        }

        // Helper to get current user ID from claims
        private Guid GetCurrentUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
            {
                // Fallback to "id" claim if NameIdentifier is empty
                userIdString = User.FindFirst("id")?.Value;
                if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out userId))
                {
                    return userId;
                }
                throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");
            }
            return userId;
        }

        // 1. GET /api/posts - Get all posts with likes & comments stats
        [HttpGet]
        public async Task<IActionResult> GetAllPosts()
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var posts = await _context.Posts
                    .Include(p => p.User)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                // Fetch tenants to match full name
                var tenants = await _context.Tenants.ToListAsync();

                // Fetch likes for current user
                var userLikes = await _context.PostLikes
                    .Where(l => l.UserId == currentUserId)
                    .Select(l => l.PostId)
                    .ToListAsync();

                // Fetch comments count for each post
                var commentsCounts = await _context.Comments
                    .GroupBy(c => c.PostId)
                    .Select(g => new { PostId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.PostId, x => x.Count);

                var result = posts.Select(p =>
                {
                    // Find tenant name if user is tenant
                    var tenant = tenants.FirstOrDefault(t => t.UserId == p.UserId);
                    string authorName = tenant != null ? tenant.FullName : (p.User?.Username ?? "Ẩn danh");

                    int commentCount = commentsCounts.TryGetValue(p.Id, out int count) ? count : 0;
                    bool isLiked = userLikes.Contains(p.Id);

                    return new
                    {
                        p.Id,
                        p.UserId,
                        author_name = authorName,
                        author_avatar = p.User?.AvatarUrl,
                        content = p.Content,
                        image_url = p.ImageUrl,
                        likes_count = p.LikesCount,
                        comments_count = commentCount,
                        is_liked = isLiked,
                        created_at = p.CreatedAt,
                        updated_at = p.UpdatedAt
                    };
                }).ToList();

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy bảng tin", error = ex.Message });
            }
        }

        public class CreatePostDto
        {
            public string Content { get; set; } = string.Empty;
            public string? ImageUrl { get; set; }
        }

        // 2. POST /api/posts - Create a new post
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest(new { success = false, message = "Nội dung bài viết không được để trống." });
            }

            try
            {
                var currentUserId = GetCurrentUserId();

                var post = new Post
                {
                    UserId = currentUserId,
                    Content = dto.Content.Trim(),
                    ImageUrl = dto.ImageUrl?.Trim(),
                    LikesCount = 0,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                // Fetch tenant details for response
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == currentUserId);
                var user = await _context.Users.FindAsync(currentUserId);
                string authorName = tenant != null ? tenant.FullName : (user?.Username ?? "Ẩn danh");

                return StatusCode(201, new
                {
                    success = true,
                    message = "Đăng bài viết thành công!",
                    data = new
                    {
                        post.Id,
                        post.UserId,
                        author_name = authorName,
                        author_avatar = user?.AvatarUrl,
                        content = post.Content,
                        image_url = post.ImageUrl,
                        likes_count = post.LikesCount,
                        comments_count = 0,
                        is_liked = false,
                        created_at = post.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi đăng bài viết", error = ex.Message });
            }
        }

        // 3. POST /api/posts/{id}/like - Toggle like/unlike for a post
        [HttpPost("{id}/like")]
        public async Task<IActionResult> ToggleLikePost(Guid id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var currentUserId = GetCurrentUserId();

                var post = await _context.Posts.FindAsync(id);
                if (post == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết." });
                }

                var existingLike = await _context.PostLikes
                    .FirstOrDefaultAsync(l => l.PostId == id && l.UserId == currentUserId);

                bool isLiked;

                if (existingLike != null)
                {
                    // Unlike
                    _context.PostLikes.Remove(existingLike);
                    post.LikesCount = Math.Max(0, post.LikesCount - 1);
                    isLiked = false;
                }
                else
                {
                    // Like
                    var like = new PostLike
                    {
                        PostId = id,
                        UserId = currentUserId
                    };
                    _context.PostLikes.Add(like);
                    post.LikesCount += 1;
                    isLiked = true;

                    // Create Notification
                    if (post.UserId != currentUserId)
                    {
                        var notification = new Notification
                        {
                            RecipientId = post.UserId,
                            SenderId = currentUserId,
                            Type = "LIKE_POST",
                            PostId = post.Id,
                            Content = "đã thích bài viết của bạn.",
                            IsRead = false,
                            CreatedAt = DateTimeOffset.UtcNow
                        };
                        _context.Notifications.Add(notification);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        post_id = id,
                        is_liked = isLiked,
                        likes_count = post.LikesCount
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi xử lý thích bài viết", error = ex.Message });
            }
        }

        // 4. GET /api/posts/{id}/comments - Get list of comments for a post
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetPostComments(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var comments = await _context.Comments
                    .Include(c => c.User)
                    .Where(c => c.PostId == id)
                    .OrderBy(c => c.CreatedAt)
                    .ToListAsync();

                var tenants = await _context.Tenants.ToListAsync();

                // Fetch comment likes for the current user
                var userCommentLikes = await _context.CommentLikes
                    .Where(cl => cl.UserId == currentUserId)
                    .Select(cl => cl.CommentId)
                    .ToListAsync();

                var result = comments.Select(c =>
                {
                    var tenant = tenants.FirstOrDefault(t => t.UserId == c.UserId);
                    string authorName = tenant != null ? tenant.FullName : (c.User?.Username ?? "Ẩn danh");
                    bool isLiked = userCommentLikes.Contains(c.Id);

                    return new
                    {
                        id = c.Id,
                        post_id = c.PostId,
                        user_id = c.UserId,
                        parent_id = c.ParentId,
                        author_name = authorName,
                        author_avatar = c.User?.AvatarUrl,
                        content = c.Content,
                        image_url = c.ImageUrl,
                        likes_count = c.LikesCount,
                        is_liked = isLiked,
                        created_at = c.CreatedAt
                    };
                }).ToList();

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách bình luận", error = ex.Message });
            }
        }

        public class CreateCommentDto
        {
            public string Content { get; set; } = string.Empty;
            public Guid? ParentId { get; set; }
            public string? ImageUrl { get; set; }
        }

        // 5. POST /api/posts/{id}/comments - Comment on a post or reply to comment
        [HttpPost("{id}/comments")]
        public async Task<IActionResult> CreateComment(Guid id, [FromBody] CreateCommentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest(new { success = false, message = "Nội dung bình luận không được để trống." });
            }

            try
            {
                var currentUserId = GetCurrentUserId();

                var post = await _context.Posts.FindAsync(id);
                if (post == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết để bình luận." });
                }

                Comment? parentComment = null;
                if (dto.ParentId.HasValue)
                {
                    parentComment = await _context.Comments.FindAsync(dto.ParentId.Value);
                    if (parentComment == null)
                    {
                        return BadRequest(new { success = false, message = "Không tìm thấy bình luận gốc để trả lời." });
                    }
                }

                var comment = new Comment
                {
                    PostId = id,
                    UserId = currentUserId,
                    Content = dto.Content.Trim(),
                    ParentId = dto.ParentId,
                    ImageUrl = dto.ImageUrl?.Trim(),
                    LikesCount = 0,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                // Create Notification
                if (dto.ParentId.HasValue && parentComment != null)
                {
                    // Case 2: Reply to comment
                    if (parentComment.UserId != currentUserId)
                    {
                        var notification = new Notification
                        {
                            RecipientId = parentComment.UserId,
                            SenderId = currentUserId,
                            Type = "REPLY_COMMENT",
                            PostId = post.Id,
                            CommentId = comment.Id,
                            Content = "đã trả lời bình luận của bạn.",
                            IsRead = false,
                            CreatedAt = DateTimeOffset.UtcNow
                        };
                        _context.Notifications.Add(notification);
                        await _context.SaveChangesAsync();
                    }
                }
                else
                {
                    // Case 1: Comment on post
                    if (post.UserId != currentUserId)
                    {
                        var notification = new Notification
                        {
                            RecipientId = post.UserId,
                            SenderId = currentUserId,
                            Type = "COMMENT_POST",
                            PostId = post.Id,
                            CommentId = comment.Id,
                            Content = "đã bình luận về bài viết của bạn.",
                            IsRead = false,
                            CreatedAt = DateTimeOffset.UtcNow
                        };
                        _context.Notifications.Add(notification);
                        await _context.SaveChangesAsync();
                    }
                }

                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == currentUserId);
                var user = await _context.Users.FindAsync(currentUserId);
                string authorName = tenant != null ? tenant.FullName : (user?.Username ?? "Ẩn danh");

                return StatusCode(201, new
                {
                    success = true,
                    message = "Gửi bình luận thành công!",
                    data = new
                    {
                        id = comment.Id,
                        post_id = comment.PostId,
                        user_id = comment.UserId,
                        parent_id = comment.ParentId,
                        author_name = authorName,
                        author_avatar = user?.AvatarUrl,
                        content = comment.Content,
                        image_url = comment.ImageUrl,
                        likes_count = comment.LikesCount,
                        is_liked = false,
                        created_at = comment.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi bình luận", error = ex.Message });
            }
        }

        // 6. POST /api/posts/comments/{commentId}/like - Toggle like/unlike for a comment
        [HttpPost("comments/{commentId}/like")]
        public async Task<IActionResult> ToggleLikeComment(Guid commentId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var currentUserId = GetCurrentUserId();

                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận." });
                }

                var existingLike = await _context.CommentLikes
                    .FirstOrDefaultAsync(cl => cl.CommentId == commentId && cl.UserId == currentUserId);

                bool isLiked;

                if (existingLike != null)
                {
                    // Unlike
                    _context.CommentLikes.Remove(existingLike);
                    comment.LikesCount = Math.Max(0, comment.LikesCount - 1);
                    isLiked = false;
                }
                else
                {
                    // Like
                    var like = new CommentLike
                    {
                        CommentId = commentId,
                        UserId = currentUserId
                    };
                    _context.CommentLikes.Add(like);
                    comment.LikesCount += 1;
                    isLiked = true;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        comment_id = commentId,
                        is_liked = isLiked,
                        likes_count = comment.LikesCount
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi xử lý thích bình luận", error = ex.Message });
            }
        }

        // 7. DELETE /api/posts/{id} - Delete a post
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(Guid id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var post = await _context.Posts.FindAsync(id);
                if (post == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết." });
                }

                // Check authorization: ADMIN or MANAGER or the post author
                bool isAuthorized = User.IsInRole("ADMIN") || 
                                    User.IsInRole("MANAGER") || 
                                    post.UserId == currentUserId;

                if (!isAuthorized)
                {
                    return StatusCode(403, new { success = false, message = "Bạn không có quyền xóa bài viết này." });
                }

                _context.Posts.Remove(post);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa bài viết thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa bài viết", error = ex.Message });
            }
        }

        // 8. DELETE /api/posts/comments/{commentId} - Delete a comment
        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(Guid commentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận." });
                }

                // Check authorization: ADMIN or MANAGER or the comment author
                bool isAuthorized = User.IsInRole("ADMIN") || 
                                    User.IsInRole("MANAGER") || 
                                    comment.UserId == currentUserId;

                if (!isAuthorized)
                {
                    return StatusCode(403, new { success = false, message = "Bạn không có quyền xóa bình luận này." });
                }

                _context.Comments.Remove(comment);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa bình luận thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa bình luận", error = ex.Message });
            }
        }
    }
}
