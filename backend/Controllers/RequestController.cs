using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartDorm.Api.Data;
using SmartDorm.Api.Models;

using SmartDorm.Api.Services;

namespace SmartDorm.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/requests")]
    public class RequestController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IPdfService _pdfService;

        public RequestController(AppDbContext context, IEmailService emailService, IPdfService pdfService)
        {
            _context = context;
            _emailService = emailService;
            _pdfService = pdfService;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> GetAllRequests()
        {
            try
            {
                var requests = await _context.RoomRequests
                    .Include(r => r.Tenant)
                    .Include(r => r.Room)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.Id,
                        r.TenantId,
                        tenant_name = r.Tenant != null ? r.Tenant.FullName : string.Empty,
                        r.RoomId,
                        room_number = r.Room != null ? r.Room.RoomNumber : string.Empty,
                        move_in_date = r.MoveInDate,
                        r.Note,
                        status = r.Status.ToString(),
                        admin_note = r.AdminNote,
                        r.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = requests });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách yêu cầu thuê phòng", error = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize(Roles = "TENANT")]
        public async Task<IActionResult> GetMyRequests()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                if (userIdClaim == null) return Unauthorized();
                var userId = Guid.Parse(userIdClaim.Value);
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null) return Ok(new { success = true, data = new List<object>() });

                var requests = await _context.RoomRequests
                    .Include(r => r.Room)
                    .Where(r => r.TenantId == tenant.Id)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.Id,
                        room_number = r.Room != null ? r.Room.RoomNumber : string.Empty,
                        move_in_date = r.MoveInDate,
                        r.Note,
                        status = r.Status.ToString(),
                        admin_note = r.AdminNote,
                        r.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = requests });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy yêu cầu của bạn", error = ex.Message });
            }
        }

        public class CreateRequestDto
        {
            public Guid RoomId { get; set; }
            public string? MoveInDate { get; set; }
            public string? Note { get; set; }
        }

        [HttpPost]
        [Authorize(Roles = "TENANT")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateRequestDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                if (userIdClaim == null) return Unauthorized();
                var userId = Guid.Parse(userIdClaim.Value);

                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.UserId == userId);
                if (tenant == null)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin sinh viên. Vui lòng cập nhật hồ sơ trước." });

                var room = await _context.Rooms.FindAsync(dto.RoomId);
                if (room == null)
                    return NotFound(new { success = false, message = "Phòng không tồn tại." });

                if (room.Status == RoomStatus.OCCUPIED)
                    return BadRequest(new { success = false, message = "Phòng này hiện đã được thuê." });

                // Check if tenant already has a pending request for this room
                var exists = await _context.RoomRequests.AnyAsync(r =>
                    r.TenantId == tenant.Id && r.RoomId == dto.RoomId && r.Status == RequestStatus.PENDING);
                if (exists)
                    return BadRequest(new { success = false, message = "Bạn đã có yêu cầu đang chờ duyệt cho phòng này." });

                DateOnly? moveInDate = null;
                if (!string.IsNullOrEmpty(dto.MoveInDate) && DateOnly.TryParse(dto.MoveInDate, out var parsedDate))
                    moveInDate = parsedDate;

                var request = new RoomRequest
                {
                    TenantId = tenant.Id,
                    RoomId = dto.RoomId,
                    MoveInDate = moveInDate,
                    Note = dto.Note,
                    Status = RequestStatus.PENDING
                };

                _context.RoomRequests.Add(request);
                await _context.SaveChangesAsync();

                // Send email confirmation with terms in background
                if (!string.IsNullOrEmpty(tenant.Email))
                {
                    string subject = $"Xác nhận đăng ký thuê phòng {room.RoomNumber} & Điều khoản KTX";
                    string body = $"<p>Xin chào <b>{tenant.FullName}</b>,</p>" +
                                  $"<p>Hệ thống SmartDorm đã tiếp nhận thành công yêu cầu đăng ký thuê phòng <b>{room.RoomNumber}</b> của bạn (Mã yêu cầu: {request.Id}).</p>" +
                                  $"<p>Yêu cầu đang chờ ban quản lý xét duyệt. Dưới đây là bản sao <b>Điều khoản & Nội quy Ký túc xá SmartDorm</b> mà bạn đã cam kết thực hiện khi đăng ký:</p>" +
                                  $"<div style='background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0; font-size: 14px; color: #475569;'>" +
                                  $"  <h3 style='margin-top: 0; color: #1e293b;'>📜 NỘI QUY & ĐIỀU KHOẢN KÝ TÚC XÁ</h3>" +
                                  $"  <ol style='padding-left: 20px; line-height: 1.6;'>" +
                                  $"    <li><b>Giờ giấc sinh hoạt:</b> Mở cửa 05:00 - Đóng cửa 23:00 hàng ngày. Sinh viên đi trễ phải báo cáo bảo vệ.</li>" +
                                  $"    <li><b>An toàn & An ninh:</b> Không dẫn người lạ vào phòng qua đêm. Khóa vân tay là tài sản chung, không chia sẻ quyền truy cập.</li>" +
                                  $"    <li><b>Nội quy phòng:</b> Giữ gìn vệ sinh chung sạch sẽ. Không làm ồn gây ảnh hưởng đến phòng bên cạnh sau 22:00.</li>" +
                                  $"    <li><b>Phòng chống cháy nổ:</b> Cấm tuyệt đối đun nấu trong phòng và tàng trữ chất cấm, chất dễ cháy nổ.</li>" +
                                  $"    <li><b>Nghĩa vụ tài chính:</b> Thanh toán đầy đủ tiền phòng, phí điện nước dịch vụ trước ngày 5 hàng tháng.</li>" +
                                  $"  </ol>" +
                                  $"</div>" +
                                  $"<p>Bạn có thể theo dõi trạng thái phê duyệt yêu cầu bằng cách truy cập vào trang cá nhân của mình:</p>" +
                                  $"<div class='btn-container'>" +
                                  $"  <a href='http://localhost:3000/tenant/invoice' class='btn' style='color: #ffffff !important;'>Kiểm tra trạng thái</a>" +
                                  $"</div>";

                    _ = Task.Run(() => _emailService.SendEmailAsync(tenant.Email, subject, body));
                }

                return StatusCode(201, new { success = true, message = "Gửi yêu cầu thuê phòng thành công! Admin sẽ xét duyệt sớm.", data = new { request.Id, status = request.Status.ToString() } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi gửi yêu cầu", error = ex.Message });
            }
        }

        public class HandleRequestDto
        {
            public string Status { get; set; } = string.Empty;
            public string? AdminNote { get; set; }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN,MANAGER")]
        public async Task<IActionResult> HandleRequest(Guid id, [FromBody] HandleRequestDto dto)
        {
            if (!Enum.TryParse<RequestStatus>(dto.Status, true, out var requestStatus))
            {
                return BadRequest(new { success = false, message = "Trạng thái không hợp lệ. Phải là APPROVED hoặc REJECTED." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.RoomRequests.FindAsync(id);
                if (request == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy yêu cầu thuê phòng." });
                }

                if (request.Status != RequestStatus.PENDING)
                {
                    return BadRequest(new { success = false, message = "Yêu cầu này đã được xử lý từ trước." });
                }

                request.Status = requestStatus;
                request.AdminNote = dto.AdminNote;
                request.UpdatedAt = DateTimeOffset.UtcNow;

                if (requestStatus == RequestStatus.APPROVED && request.TenantId != null && request.RoomId != null)
                {
                    // Verify room is still available
                    var room = await _context.Rooms.FindAsync(request.RoomId);
                    if (room == null)
                    {
                        return BadRequest(new { success = false, message = "Phòng không tồn tại." });
                    }
                    if (room.Status == RoomStatus.OCCUPIED)
                    {
                        return BadRequest(new { success = false, message = "Phòng này hiện đã được thuê bởi người khác." });
                    }

                    // Create Contract
                    var contract = new Contract
                    {
                        TenantId = request.TenantId,
                        RoomId = request.RoomId,
                        StartDate = request.MoveInDate ?? DateOnly.FromDateTime(DateTime.Today),
                        EndDate = (request.MoveInDate ?? DateOnly.FromDateTime(DateTime.Today)).AddMonths(12), // default 1 year
                        Status = ContractStatus.ACTIVE
                    };
                    _context.Contracts.Add(contract);

                    // Update room status based on capacity
                    var activeContractsCount = await _context.Contracts.CountAsync(c => c.RoomId == request.RoomId && c.Status == ContractStatus.ACTIVE);
                    if (activeContractsCount + 1 >= room.Capacity)
                    {
                        room.Status = RoomStatus.OCCUPIED;
                    }
                    else
                    {
                        room.Status = RoomStatus.AVAILABLE;
                    }
                    room.UpdatedAt = DateTimeOffset.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Send email notification in background
                if (request.TenantId != null && request.RoomId != null)
                {
                    var tenant = await _context.Tenants.FindAsync(request.TenantId);
                    var room = await _context.Rooms.FindAsync(request.RoomId);
                    if (tenant != null && !string.IsNullOrEmpty(tenant.Email))
                    {
                        string subject = requestStatus == RequestStatus.APPROVED 
                            ? "Yêu cầu thuê phòng của bạn đã được PHÊ DUYỆT" 
                            : "Yêu cầu thuê phòng của bạn đã bị TỪ CHỐI";

                        var today = DateTime.Today;
                        string body = "";
                        if (requestStatus == RequestStatus.APPROVED)
                        {
                            var startDateStr = request.MoveInDate?.ToString("dd/MM/yyyy") ?? today.ToString("dd/MM/yyyy");
                            var endDateStr = (request.MoveInDate ?? DateOnly.FromDateTime(today)).AddMonths(12).ToString("dd/MM/yyyy");
                            var basePriceStr = room?.BasePrice.ToString("N0") ?? "0";
                            var electricPriceStr = room?.ElectricityPrice.ToString("N0") ?? "0";
                            var waterPriceStr = room?.WaterPrice.ToString("N0") ?? "0";
                            var garbageFeeStr = room?.GarbageFee.ToString("N0") ?? "0";

                            body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: 'Times New Roman', Times, serif; background-color: #f1f5f9; padding: 30px; color: #1e293b; }}
        .contract-paper {{ max-width: 800px; margin: 0 auto; background: #ffffff; padding: 50px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 8px; border: 1px solid #e2e8f0; }}
        .national-title {{ text-align: center; font-weight: bold; font-size: 16px; text-transform: uppercase; margin-bottom: 5px; }}
        .national-subtitle {{ text-align: center; font-size: 14px; margin-bottom: 15px; }}
        .national-divider {{ width: 150px; height: 1px; background: #1e293b; margin: 0 auto 30px auto; }}
        .contract-title {{ text-align: center; font-weight: bold; font-size: 20px; text-transform: uppercase; margin-bottom: 30px; }}
        .legal-basis {{ font-style: italic; margin-bottom: 20px; font-size: 14px; line-height: 1.5; }}
        .legal-basis ul {{ padding-left: 20px; margin: 5px 0; }}
        .section-title {{ font-weight: bold; text-transform: uppercase; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }}
        .info-table {{ width: 100%; border-collapse: collapse; margin-bottom: 15px; }}
        .info-table td {{ padding: 6px 4px; vertical-align: top; font-size: 14px; }}
        .info-table td.label {{ width: 150px; font-weight: bold; }}
        .clause {{ margin-bottom: 15px; text-align: justify; font-size: 14px; line-height: 1.6; }}
        .clause-title {{ font-weight: bold; }}
        .signature-section {{ margin-top: 40px; width: 100%; }}
        .signature-col {{ width: 50%; text-align: center; font-size: 14px; float: left; }}
        .signature-space {{ height: 80px; }}
        .btn-container {{ text-align: center; margin-top: 30px; clear: both; }}
        .btn {{ display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 15px; }}
    </style>
</head>
<body>
    <div class='contract-paper'>
        <div class='national-title'>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class='national-subtitle'>Độc lập - Tự do - Hạnh phúc</div>
        <div class='national-divider'></div>
        
        <div class='contract-title'>HỢP ĐỒNG THUÊ PHÒNG KÝ TÚC XÁ</div>
        
        <div class='legal-basis'>
            <ul>
                <li>Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;</li>
                <li>Căn cứ Luật Nhà ở số 65/2014/QH13 ngày 25/11/2014;</li>
                <li>Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</li>
            </ul>
        </div>
        
        <p>Hôm nay, ngày {today.Day} tháng {today.Month} năm {today.Year}, chúng tôi gồm các bên:</p>
        
        <div class='section-title'>BÊN CHO THUÊ (BÊN A)</div>
        <table class='info-table'>
            <tr>
                <td class='label'>Đại diện:</td>
                <td>BAN QUẢN LÝ KÝ TÚC XÁ SMARTDORM</td>
            </tr>
            <tr>
                <td class='label'>MST:</td>
                <td>0102030405</td>
            </tr>
            <tr>
                <td class='label'>Địa chỉ:</td>
                <td>Khu Công nghệ cao, Võ Chí Công, Quận 9, TP. Hồ Chí Minh</td>
            </tr>
            <tr>
                <td class='label'>Điện thoại:</td>
                <td>1900 8198</td>
            </tr>
            <tr>
                <td class='label'>Email:</td>
                <td>support@smartdorm.vn</td>
            </tr>
        </table>
        
        <div class='section-title'>BÊN THUÊ (BÊN B)</div>
        <table class='info-table'>
            <tr>
                <td class='label'>Họ và tên:</td>
                <td><strong>{tenant.FullName}</strong></td>
            </tr>
            <tr>
                <td class='label'>CMND/CCCD số:</td>
                <td>{tenant.Cccd}</td>
            </tr>
            <tr>
                <td class='label'>Điện thoại:</td>
                <td>{tenant.Phone ?? "N/A"}</td>
            </tr>
            <tr>
                <td class='label'>Email:</td>
                <td>{tenant.Email ?? "N/A"}</td>
            </tr>
        </table>
        
        <p>Hai bên thống nhất ký kết hợp đồng thuê phòng với các điều khoản cụ thể như sau:</p>
        
        <div class='section-title'>ĐIỀU 1: THÔNG TIN PHÒNG THUÊ VÀ GIÁ CẢ</div>
        <div class='clause'>
            <span class='clause-title'>1.1. Phòng thuê:</span> Bên A đồng ý cho Bên B thuê phòng số <strong>{room?.RoomNumber}</strong> thuộc hệ thống SmartDorm.<br/>
            <span class='clause-title'>1.2. Mục đích sử dụng:</span> Dùng làm nơi để ở và học tập/sinh hoạt của sinh viên/học viên đăng ký.<br/>
            <span class='clause-title'>1.3. Thời hạn thuê:</span> 12 tháng kể từ ngày <strong>{startDateStr}</strong> đến ngày <strong>{endDateStr}</strong>.<br/>
            <span class='clause-title'>1.4. Giá thuê phòng:</span> <strong>{basePriceStr} VND/tháng</strong> (Chưa bao gồm các khoản chi phí dịch vụ điện, nước, internet, vệ sinh).<br/>
            <span class='clause-title'>1.5. Chi phí dịch vụ kèm theo:</span>
            <ul>
                <li>Đơn giá điện: {electricPriceStr} VND/kWh</li>
                <li>Đơn giá nước: {waterPriceStr} VND/m3</li>
                <li>Phí rác & vệ sinh: {garbageFeeStr} VND/tháng</li>
            </ul>
        </div>
        
        <div class='section-title'>ĐIỀU 2: QUYỀN VÀ NGHĨA VỤ CỦA HAI BÊN</div>
        <div class='clause'>
            <span class='clause-title'>2.1. Quyền và nghĩa vụ của Bên A:</span> Bàn giao phòng thuê đúng thời hạn và bảo đảm cơ sở vật chất hoạt động ổn định; có quyền đơn phương chấm dứt hợp đồng nếu Bên B vi phạm nghiêm trọng nội quy.<br/>
            <span class='clause-title'>2.2. Quyền và nghĩa vụ của Bên B:</span> Thanh toán đầy đủ tiền thuê và chi phí dịch vụ trước ngày 5 hàng tháng; cam kết chấp hành nghiêm chỉnh nội quy ký túc xá (giờ đóng/mở cửa, không tàng trữ chất cấm, không đun nấu trái phép trong phòng, giữ gìn vệ sinh chung).
        </div>
        
        <div class='section-title'>ĐIỀU 3: HIỆU LỰC HỢP ĐỒNG</div>
        <div class='clause'>
            Hợp đồng này có hiệu lực kể từ ngày ký và được lập bằng hình thức hợp đồng điện tử gửi trực tiếp tới email của Bên B.
        </div>
        
        <div class='signature-section'>
            <div class='signature-col'>
                <strong>ĐẠI DIỆN BÊN A</strong><br/>
                (Đã ký điện tử)<br/>
                <div class='signature-space'></div>
                <strong>SMARTDORM MANAGEMENT</strong>
            </div>
            <div class='signature-col'>
                <strong>BÊN THUÊ (BÊN B)</strong><br/>
                (Đã ký điện tử)<br/>
                <div class='signature-space'></div>
                <strong>{tenant.FullName}</strong>
            </div>
            <div style='clear: both;'></div>
        </div>
        
        <div class='btn-container'>
            <a href='http://localhost:3000/login' class='btn'>Truy cập SmartDorm</a>
        </div>
    </div>
</body>
</html>";
                        }
                        else
                        {
                            body = $"<p>Xin chào <b>{tenant.FullName}</b>,</p>" +
                                   $"<p>Chúng tôi rất tiếc phải thông báo rằng yêu cầu thuê phòng <b>{room?.RoomNumber}</b> của bạn đã <b>không được phê duyệt</b>.</p>" +
                                   $"<div style='background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 6px;'>" +
                                   $"  <strong style='color: #991b1b;'>Lý do từ ban quản lý:</strong>" +
                                   $"  <p style='margin: 5px 0 0 0; color: #7f1d1d;'>{dto.AdminNote ?? "Không có lý do cụ thể."}</p>" +
                                   $"</div>" +
                                   $"<p>Bạn có thể kiểm tra lại thông tin, nộp yêu cầu cho phòng khác hoặc liên hệ trực tiếp với ban quản lý để được hỗ trợ.</p>" +
                                   $"<div class='btn-container'>" +
                                   $"  <a href='http://localhost:3000/' class='btn' style='color: #ffffff !important;'>Xem danh sách phòng khác</a>" +
                                   $"</div>";
                        }

                        byte[]? pdfBytes = null;
                        string? pdfName = null;
                        if (requestStatus == RequestStatus.APPROVED && room != null)
                        {
                            try
                            {
                                pdfBytes = _pdfService.GenerateContractPdf(tenant, room, request);
                                pdfName = $"HopDongThuePhong_{room.RoomNumber}.pdf";
                            }
                            catch (Exception ex)
                            {
                                // Log or fallback
                            }
                        }

                        _ = Task.Run(() => _emailService.SendEmailAsync(tenant.Email!, subject, body, pdfBytes, pdfName));
                    }
                }

                return Ok(new { success = true, message = $"Đã xử lý yêu cầu thành công ({requestStatus})", data = request });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Lỗi khi xử lý yêu cầu", error = ex.Message });
            }
        }
    }
}
