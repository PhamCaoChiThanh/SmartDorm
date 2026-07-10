using System;
using SmartDorm.Api.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace SmartDorm.Api.Services
{
    public interface IPdfService
    {
        byte[] GenerateContractPdf(Tenant tenant, Room room, RoomRequest request);
        byte[] GenerateTerminationPdf(Tenant tenant, Room room, Contract contract);
        byte[] GenerateRenewalPdf(Tenant tenant, Room room, Contract contract, DateOnly newEndDate);
        byte[] GenerateInvoicePdf(Invoice invoice, Tenant tenant, Room room, IEnumerable<UtilityUsage> usages, int roommateCount = 1);
    }

    public class PdfService : IPdfService
    {
        static PdfService()
        {
            // Set QuestPDF license type to Community
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GenerateContractPdf(Tenant tenant, Room room, RoomRequest request)
        {
            var today = DateTime.Today;
            var startDateStr = request.MoveInDate?.ToString("dd/MM/yyyy") ?? today.ToString("dd/MM/yyyy");
            var endDateStr = (request.MoveInDate ?? DateOnly.FromDateTime(today)).AddMonths(12).ToString("dd/MM/yyyy");
            var basePriceStr = room?.BasePrice.ToString("N0") ?? "0";
            var electricPriceStr = room?.ElectricityPrice.ToString("N0") ?? "0";
            var waterPriceStr = room?.WaterPrice.ToString("N0") ?? "0";
            var garbageFeeStr = room?.GarbageFee.ToString("N0") ?? "0";

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.4f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9f).FontColor(Colors.Black).LineHeight(1.25f));
                    
                    page.Content()
                        .Column(column =>
                        {
                            column.Spacing(4);
                            
                            // Tiêu ngữ Quốc gia (Viết trực tiếp lên column để đảm bảo render)
                            column.Item().AlignCenter().Text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM").Bold().FontSize(10.5f);
                            column.Item().AlignCenter().Text("Độc lập - Tự do - Hạnh phúc").Bold().FontSize(9f);
                            column.Item().AlignCenter().Width(110).PaddingTop(2).LineHorizontal(0.8f).LineColor(Colors.Black);
                            
                            column.Item().PaddingTop(10).PaddingBottom(5).AlignCenter().Text("HỢP ĐỒNG THUÊ PHÒNG KÝ TÚC XÁ").Bold().FontSize(13);
                            
                            column.Item().Text(t =>
                            {
                                t.Line("- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                                t.Line("- Căn cứ Luật Nhà ở số 65/2014/QH13 ngày 25/11/2014;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                                t.Line("- Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                            });
                            
                            column.Item().PaddingTop(2).Text($"Hôm nay, ngày {today.Day} tháng {today.Month} năm {today.Year}, chúng tôi gồm các bên:");
                            
                            // BÊN CHO THUÊ
                            column.Item().PaddingTop(2).Text("BÊN CHO THUÊ (BÊN A)").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                            column.Item().PaddingLeft(10).Column(colA =>
                            {
                                colA.Item().Text(t => { t.Span("• Đại diện: ").Bold(); t.Span("BAN QUẢN LÝ KÝ TÚC XÁ SMARTDORM"); });
                                colA.Item().Text(t => { t.Span("• Mã số thuế: ").Bold(); t.Span("0102030405"); });
                                colA.Item().Text(t => { t.Span("• Địa chỉ: ").Bold(); t.Span("Khu Công nghệ cao, Võ Chí Công, Quận 9, TP. Hồ Chí Minh"); });
                                colA.Item().Text(t => { t.Span("• Điện thoại: ").Bold(); t.Span("1900 8198"); });
                                colA.Item().Text(t => { t.Span("• Email: ").Bold(); t.Span("support@smartdorm.vn"); });
                            });
                            
                            // BÊN THUÊ
                            column.Item().PaddingTop(4).Text("BÊN THUÊ (BÊN B)").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                            column.Item().PaddingLeft(10).Column(colB =>
                            {
                                colB.Item().Text(t => { t.Span("• Họ và tên: ").Bold(); t.Span(tenant.FullName); });
                                colB.Item().Text(t => { t.Span("• CMND/CCCD số: ").Bold(); t.Span(tenant.Cccd); });
                                colB.Item().Text(t => { t.Span("• Điện thoại: ").Bold(); t.Span(tenant.Phone ?? "N/A"); });
                                colB.Item().Text(t => { t.Span("• Email: ").Bold(); t.Span(tenant.Email ?? "N/A"); });
                            });
                            
                            // ĐIỀU 1
                            column.Item().PaddingTop(4).Text("ĐIỀU 1: THÔNG TIN PHÒNG THUÊ VÀ GIÁ CẢ").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                            column.Item().PaddingLeft(10).Column(colD1 =>
                            {
                                colD1.Item().Text(t => { t.Span("1.1. Phòng thuê: ").Bold(); t.Span($"Bên A đồng ý cho Bên B thuê phòng số {room?.RoomNumber} thuộc hệ thống SmartDorm."); });
                                colD1.Item().Text(t => { t.Span("1.2. Mục đích sử dụng: ").Bold(); t.Span("Dùng làm nơi để ở và học tập/sinh hoạt."); });
                                colD1.Item().Text(t => { t.Span("1.3. Thời hạn thuê: ").Bold(); t.Span($"12 tháng kể từ ngày {startDateStr} đến ngày {endDateStr}."); });
                                colD1.Item().Text(t => { t.Span("1.4. Giá thuê phòng: ").Bold(); t.Span($"{basePriceStr} VND/tháng."); });
                                colD1.Item().Text(t => { t.Span("1.5. Chi phí dịch vụ kèm theo: ").Bold(); t.Span($"Điện: {electricPriceStr} VND/kWh, Nước: {waterPriceStr} VND/m3, Rác: {garbageFeeStr} VND/tháng."); });
                            });
                            
                            // ĐIỀU 2
                            column.Item().PaddingTop(4).Text("ĐIỀU 2: QUYỀN VÀ NGHĨA VỤ CỦA HAI BÊN").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                            column.Item().PaddingLeft(10).Column(colD2 =>
                            {
                                colD2.Item().Text(t => { t.Span("2.1. Quyền và nghĩa vụ của Bên A: ").Bold(); t.Span("Bàn giao phòng thuê đúng thời hạn và bảo đảm cơ sở vật chất hoạt động ổn định."); });
                                colD2.Item().Text(t => { t.Span("2.2. Quyền và nghĩa vụ của Bên B: ").Bold(); t.Span("Thanh toán đầy đủ tiền thuê và chi phí dịch vụ trước ngày 5 hàng tháng; cam kết chấp hành nghiêm chỉnh nội quy ký túc xá."); });
                            });

                            // ĐIỀU 3
                            column.Item().PaddingTop(4).Text("ĐIỀU 3: HIỆU LỰC HỢP ĐỒNG").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                            column.Item().PaddingLeft(10).Text("Hợp đồng này có hiệu lực kể từ ngày ký và được lập bằng hình thức hợp đồng điện tử có giá trị pháp lý tương đương văn bản giấy.");
                             
                            // Chữ ký
                            column.Item().PaddingTop(15).Row(row =>
                            {
                                row.RelativeItem().AlignCenter().Column(sigA =>
                                {
                                    sigA.Item().Text("ĐẠI DIỆN BÊN A").Bold().FontSize(9f);
                                    sigA.Item().Text("(Đã ký điện tử)").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                    sigA.Item().PaddingTop(25).Text("SMARTDORM MANAGEMENT").Bold().FontSize(8.5f);
                                });
                                row.RelativeItem().AlignCenter().Column(sigB =>
                                {
                                    sigB.Item().Text("BÊN THUÊ (BÊN B)").Bold().FontSize(9f);
                                    sigB.Item().Text("(Đã ký điện tử)").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                    sigB.Item().PaddingTop(25).Text(tenant.FullName).Bold().FontSize(8.5f);
                                });
                            });
                        });
                });
            }).GeneratePdf();
        }

        public byte[] GenerateTerminationPdf(Tenant tenant, Room room, Contract contract)
        {
            var today = DateTime.Today;
            var terminationDateStr = today.ToString("dd/MM/yyyy");
            var startDateStr = contract.StartDate.ToString("dd/MM/yyyy");
            var endDateStr = contract.EndDate.ToString("dd/MM/yyyy");

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.4f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9f).FontColor(Colors.Black).LineHeight(1.3f));

                    page.Content().Column(column =>
                    {
                        column.Spacing(5);

                        // Quốc hiệu
                        column.Item().AlignCenter().Text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM").Bold().FontSize(10.5f);
                        column.Item().AlignCenter().Text("Độc lập - Tự do - Hạnh phúc").Bold().FontSize(9f);
                        column.Item().AlignCenter().Width(110).PaddingTop(2).LineHorizontal(0.8f).LineColor(Colors.Black);

                        column.Item().PaddingTop(10).PaddingBottom(5).AlignCenter()
                            .Text("BIÊN BẢN CHẤM DỨT HỢP ĐỒNG THUÊ PHÒNG").Bold().FontSize(13);
                        column.Item().AlignCenter().Text($"Ngày {today.Day} tháng {today.Month} năm {today.Year}").Italic().FontSize(9f).FontColor(Colors.Grey.Darken2);

                        column.Item().PaddingTop(8).Text(t =>
                        {
                            t.Line("- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                            t.Line("- Căn cứ Luật Nhà ở số 65/2014/QH13 ngày 25/11/2014;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                            t.Line($"- Căn cứ Hợp đồng thuê phòng số {room?.RoomNumber} đã ký kết giữa hai bên;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                        });

                        column.Item().PaddingTop(4).Text($"Hôm nay, ngày {today.Day} tháng {today.Month} năm {today.Year}, hai bên gồm:");

                        // BÊN CHO THUÊ
                        column.Item().PaddingTop(6).Text("BÊN CHO THUÊ (BÊN A)").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Column(colA =>
                        {
                            colA.Item().Text(t => { t.Span("• Đại diện: ").Bold(); t.Span("BAN QUẢN LÝ KÝ TÚC XÁ SMARTDORM"); });
                            colA.Item().Text(t => { t.Span("• Địa chỉ: ").Bold(); t.Span("Khu Công nghệ cao, Võ Chí Công, Quận 9, TP. Hồ Chí Minh"); });
                            colA.Item().Text(t => { t.Span("• Điện thoại: ").Bold(); t.Span("1900 8198"); });
                        });

                        // BÊN THUÊ
                        column.Item().PaddingTop(4).Text("BÊN THUÊ (BÊN B)").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Column(colB =>
                        {
                            colB.Item().Text(t => { t.Span("• Họ và tên: ").Bold(); t.Span(tenant.FullName); });
                            colB.Item().Text(t => { t.Span("• CMND/CCCD số: ").Bold(); t.Span(tenant.Cccd); });
                            colB.Item().Text(t => { t.Span("• Điện thoại: ").Bold(); t.Span(tenant.Phone ?? "N/A"); });
                            colB.Item().Text(t => { t.Span("• Email: ").Bold(); t.Span(tenant.Email ?? "N/A"); });
                        });

                        // Điều 1: Thông tin chấm dứt
                        column.Item().PaddingTop(6).Text("ĐIỀU 1: NỘI DUNG CHẤM DỨT HỢP ĐỒNG").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Column(colD1 =>
                        {
                            colD1.Item().Text(t => { t.Span("1.1. Phòng thuê: ").Bold(); t.Span($"Phòng số {room?.RoomNumber} thuộc hệ thống KTX SmartDorm."); });
                            colD1.Item().Text(t => { t.Span("1.2. Thời hạn hợp đồng gốc: ").Bold(); t.Span($"Từ ngày {startDateStr} đến ngày {endDateStr}."); });
                            colD1.Item().Text(t => { t.Span("1.3. Ngày chấm dứt thực tế: ").Bold(); t.Span($"{terminationDateStr} (trước hạn hợp đồng gốc)."); });
                            colD1.Item().Text(t => { t.Span("1.4. Lý do: ").Bold(); t.Span("Theo đề nghị của Ban quản lý KTX và/hoặc sinh viên."); });
                        });

                        // Điều 2: Cam kết
                        column.Item().PaddingTop(4).Text("ĐIỀU 2: CAM KẾT CỦA HAI BÊN").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Column(colD2 =>
                        {
                            colD2.Item().Text(t => { t.Span("2.1. ").Bold(); t.Span("Bên B cam kết bàn giao lại phòng trong tình trạng nguyên vẹn, thanh toán toàn bộ các khoản chi phí còn nợ (tiền thuê, điện, nước, v.v.) trước khi rời KTX."); });
                            colD2.Item().Text(t => { t.Span("2.2. ").Bold(); t.Span("Bên A cam kết hoàn trả tiền cọc (nếu có) và các khoản đã thu thừa cho Bên B trong vòng 7 ngày làm việc kể từ ngày lập biên bản."); });
                            colD2.Item().Text(t => { t.Span("2.3. ").Bold(); t.Span("Hai bên thống nhất chấm dứt hoàn toàn Hợp đồng thuê phòng, mọi quyền và nghĩa vụ liên quan đến hợp đồng cũ đều kết thúc kể từ ngày lập biên bản này."); });
                        });

                        // Điều 3: Hiệu lực
                        column.Item().PaddingTop(4).Text("ĐIỀU 3: HIỆU LỰC BIÊN BẢN").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Text("Biên bản này có giá trị pháp lý tương đương văn bản giấy, được lập thành 02 bản có giá trị như nhau, mỗi bên giữ 01 bản và có hiệu lực kể từ ngày ký.");

                        // Chữ ký
                        column.Item().PaddingTop(15).Row(row =>
                        {
                            row.RelativeItem().AlignCenter().Column(sigA =>
                            {
                                sigA.Item().Text("ĐẠI DIỆN BÊN A").Bold().FontSize(9f);
                                sigA.Item().Text("(Đã ký điện tử)").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                sigA.Item().PaddingTop(25).Text("SMARTDORM MANAGEMENT").Bold().FontSize(8.5f);
                            });
                            row.RelativeItem().AlignCenter().Column(sigB =>
                            {
                                sigB.Item().Text("BÊN THUÊ (BÊN B)").Bold().FontSize(9f);
                                sigB.Item().Text("(Đã ký điện tử)").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                sigB.Item().PaddingTop(25).Text(tenant.FullName).Bold().FontSize(8.5f);
                            });
                        });
                    });
                });
            }).GeneratePdf();
        }

        public byte[] GenerateRenewalPdf(Tenant tenant, Room room, Contract contract, DateOnly newEndDate)
        {
            var today = DateTime.Today;
            var oldEndDateStr = contract.EndDate.ToString("dd/MM/yyyy");
            var newEndDateStr = newEndDate.ToString("dd/MM/yyyy");
            var startDateStr = contract.StartDate.ToString("dd/MM/yyyy");

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.4f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9f).FontColor(Colors.Black).LineHeight(1.3f));

                    page.Content().Column(column =>
                    {
                        column.Spacing(5);

                        // Quốc hiệu
                        column.Item().AlignCenter().Text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM").Bold().FontSize(10.5f);
                        column.Item().AlignCenter().Text("Độc lập - Tự do - Hạnh phúc").Bold().FontSize(9f);
                        column.Item().AlignCenter().Width(110).PaddingTop(2).LineHorizontal(0.8f).LineColor(Colors.Black);

                        column.Item().PaddingTop(10).PaddingBottom(5).AlignCenter()
                            .Text("PHỤ LỤC GIA HẠN HỢP ĐỒNG THUÊ PHÒNG").Bold().FontSize(13);
                        column.Item().AlignCenter().Text($"Ngày {today.Day} tháng {today.Month} năm {today.Year}").Italic().FontSize(9f).FontColor(Colors.Grey.Darken2);

                        column.Item().PaddingTop(8).Text(t =>
                        {
                            t.Line("- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                            t.Line("- Căn cứ Luật Nhà ở số 65/2014/QH13 ngày 25/11/2014;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                            t.Line($"- Căn cứ Hợp đồng thuê phòng số {room?.RoomNumber} đã ký kết ngày {startDateStr};").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                            t.Line("- Theo sự thốa thuận của các bên;").Italic().FontSize(8f).FontColor(Colors.Grey.Darken2);
                        });

                        column.Item().PaddingTop(4).Text($"Hôm nay, ngày {today.Day} tháng {today.Month} năm {today.Year}, hai bên gồm:");

                        // BÊN CHO THUÊ
                        column.Item().PaddingTop(6).Text("BÊN CHO THUÊ (BÊN A)").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Column(colA =>
                        {
                            colA.Item().Text(t => { t.Span("• Đại diện: ").Bold(); t.Span("BAN QUẢN LÝ KÝ TÚC XÁ SMARTDORM"); });
                            colA.Item().Text(t => { t.Span("• Địa chỉ: ").Bold(); t.Span("Khu Công nghệ cao, Võ Chí Công, Quận 9, TP. Hồ Chí Minh"); });
                            colA.Item().Text(t => { t.Span("• Điện thoại: ").Bold(); t.Span("1900 8198"); });
                        });

                        // BÊN THUÊ
                        column.Item().PaddingTop(4).Text("BÊN THUÊ (BÊN B)").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Column(colB =>
                        {
                            colB.Item().Text(t => { t.Span("• Họ và tên: ").Bold(); t.Span(tenant.FullName); });
                            colB.Item().Text(t => { t.Span("• CMND/CCCD số: ").Bold(); t.Span(tenant.Cccd); });
                            colB.Item().Text(t => { t.Span("• Điện thoại: ").Bold(); t.Span(tenant.Phone ?? "N/A"); });
                            colB.Item().Text(t => { t.Span("• Email: ").Bold(); t.Span(tenant.Email ?? "N/A"); });
                        });

                        // Điều 1: Thông tin gia hạn
                        column.Item().PaddingTop(6).Text("ĐIỀU 1: NỘI DUNG GIA HẠN HỢP ĐỒNG").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Column(colD1 =>
                        {
                            colD1.Item().Text(t => { t.Span("1.1. Phòng thuê: ").Bold(); t.Span($"Phòng số {room?.RoomNumber} thuộc hệ thống KTX SmartDorm."); });
                            colD1.Item().Text(t => { t.Span("1.2. Thời hạn hợp đồng gốc: ").Bold(); t.Span($"Từ ngày {startDateStr} đến ngày {oldEndDateStr}."); });
                            colD1.Item().Text(t => { t.Span("1.3. Thời hạn gia hạn mới: ").Bold(); t.Span($"Kéo dài đến ngày {newEndDateStr}."); });
                            colD1.Item().Text(t => { t.Span("1.4. Giá thuê: ").Bold(); t.Span("Giữ nguyên theo hợp đồng gốc, không thay đổi."); });
                            colD1.Item().Text(t => { t.Span("1.5. Các điều khoản khác: ").Bold(); t.Span("Giữ nguyên theo hợp đồng thuê phòng ban đầu đã ký kết."); });
                        });

                        // Điều 2: Cam kết
                        column.Item().PaddingTop(4).Text("ĐIỀU 2: CAM KẾT CỦA HAI BÊN").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Column(colD2 =>
                        {
                            colD2.Item().Text(t => { t.Span("2.1. ").Bold(); t.Span("Bên B cam kết tiếp tục chấp hành đầy đủ nội quy KTX và thanh toán đầy đủ tiền thuê, dịch vụ trong suốt thời gian gia hạn."); });
                            colD2.Item().Text(t => { t.Span("2.2. ").Bold(); t.Span("Bên A cam kết duy trì chất lượng dịch vụ và cơ sở vật chất như đã thỏa thuận trong hợp đồng gốc."); });
                            colD2.Item().Text(t => { t.Span("2.3. ").Bold(); t.Span("Phụ lục gia hạn này có giá trị pháp lý tương đương hợp đồng gốc."); });
                        });

                        // Điều 3: Hiệu lực
                        column.Item().PaddingTop(4).Text("ĐIỀU 3: HIỆU LỰC PHỤ LỤC").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingLeft(10).Text($"Phụ lục này có hiệu lực kể từ ngày ký, là bộ phận không tách rời của Hợp đồng thuê phòng số {room?.RoomNumber} đã ký ngày {startDateStr}.");

                        // Chữ ký
                        column.Item().PaddingTop(15).Row(row =>
                        {
                            row.RelativeItem().AlignCenter().Column(sigA =>
                            {
                                sigA.Item().Text("ĐẠI DIỆN BÊN A").Bold().FontSize(9f);
                                sigA.Item().Text("(Đã ký điện tử)").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                sigA.Item().PaddingTop(25).Text("SMARTDORM MANAGEMENT").Bold().FontSize(8.5f);
                            });
                            row.RelativeItem().AlignCenter().Column(sigB =>
                            {
                                sigB.Item().Text("BÊN THUÊ (BÊN B)").Bold().FontSize(9f);
                                sigB.Item().Text("(Đã ký điện tử)").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                sigB.Item().PaddingTop(25).Text(tenant.FullName).Bold().FontSize(8.5f);
                            });
                        });
                    });
                });
            }).GeneratePdf();
        }

        public byte[] GenerateInvoicePdf(Invoice invoice, Tenant tenant, Room room, IEnumerable<UtilityUsage> usages, int roommateCount = 1)
        {
            var today = DateTime.Today;
            var electricUsage = usages.FirstOrDefault(u => u.Type == UtilityType.ELECTRIC);
            var waterUsage = usages.FirstOrDefault(u => u.Type == UtilityType.WATER);
            int electricConsumed = electricUsage != null ? electricUsage.NewIndex - electricUsage.OldIndex : 0;
            int waterConsumed = waterUsage != null ? waterUsage.NewIndex - waterUsage.OldIndex : 0;
            decimal garbageFeeShared = roommateCount > 0 ? room.GarbageFee / roommateCount : room.GarbageFee;

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.4f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9f).FontColor(Colors.Black).LineHeight(1.3f));

                    page.Content().Column(column =>
                    {
                        column.Spacing(5);

                        // Quốc hiệu
                        column.Item().AlignCenter().Text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM").Bold().FontSize(10.5f);
                        column.Item().AlignCenter().Text("Độc lập - Tự do - Hạnh phúc").Bold().FontSize(9f);
                        column.Item().AlignCenter().Width(110).PaddingTop(2).LineHorizontal(0.8f).LineColor(Colors.Black);

                        var isPaid = invoice.Status == InvoiceStatus.PAID;
                        var titleText = isPaid ? "HÓA ĐƠN ĐÃ THANH TOÁN" : "HÓA ĐƠN TIỀN PHÒNG KHOÁN";
                        var titleColor = isPaid ? Colors.Green.Darken2 : Colors.Black;

                        column.Item().PaddingTop(10).PaddingBottom(3).AlignCenter()
                            .Text(titleText).Bold().FontSize(13).FontColor(titleColor);
                        column.Item().AlignCenter().Text($"Tháng {invoice.BillingMonth}/{invoice.BillingYear}").Bold().FontSize(10f).FontColor(Colors.Blue.Darken2);
                        column.Item().AlignCenter().Text($"Ngày lập: {today.Day}/{today.Month}/{today.Year}").Italic().FontSize(8.5f).FontColor(Colors.Grey.Darken1);

                        column.Item().PaddingTop(8).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);

                        // Thông tin
                        column.Item().PaddingTop(6).Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("THÔNG TIN NGƯỜI THUÊ").Bold().FontSize(9f).FontColor(Colors.Blue.Darken3);
                                col.Item().PaddingTop(3).Text(t => { t.Span("• Họ tên: ").Bold(); t.Span(tenant.FullName); });
                                col.Item().Text(t => { t.Span("• CCCD: ").Bold(); t.Span(tenant.Cccd ?? "N/A"); });
                                col.Item().Text(t => { t.Span("• Email: ").Bold(); t.Span(tenant.Email ?? "N/A"); });
                                col.Item().Text(t => { t.Span("• Điện thoại: ").Bold(); t.Span(tenant.Phone ?? "N/A"); });
                            });
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("THÔNG TIN PHÒNG").Bold().FontSize(9f).FontColor(Colors.Blue.Darken3);
                                col.Item().PaddingTop(3).Text(t => { t.Span("• Phòng: ").Bold(); t.Span(room.RoomNumber ?? "N/A"); });
                                col.Item().Text(t => { t.Span("• Giá thuê: ").Bold(); t.Span($"{room.BasePrice:N0} VND/tháng"); });
                                col.Item().Text(t => { t.Span("• Giá điện: ").Bold(); t.Span($"{room.ElectricityPrice:N0} VND/kWh"); });
                                col.Item().Text(t => { t.Span("• Giá nước: ").Bold(); t.Span($"{room.WaterPrice:N0} VND/m³"); });
                            });
                        });

                        column.Item().PaddingTop(10).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);

                        // Bảng chi tiết
                        column.Item().PaddingTop(8).Text("CHI TIẾT HÓA ĐƠN").Bold().FontSize(9.5f).FontColor(Colors.Blue.Darken3);
                        column.Item().PaddingTop(5).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(3);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                            });

                            // Header
                            void HeaderCell(IContainer cell, string text) =>
                                cell.Background(Colors.Blue.Darken3).Padding(5).AlignCenter().Text(text).Bold().FontSize(8.5f).FontColor(Colors.White);

                            HeaderCell(table.Cell(), "Khoản mục");
                            HeaderCell(table.Cell(), "Chỉ số cũ");
                            HeaderCell(table.Cell(), "Chỉ số mới");
                            HeaderCell(table.Cell(), "Tiêu thụ");
                            HeaderCell(table.Cell(), "Thành tiền");


                            // Row helper
                            Action<string, string, string, string, string, bool> dataRow = (item, old, nw, usage, amount, isAlt) =>
                            {
                                var bg = isAlt ? Colors.Grey.Lighten4 : Colors.White;
                                table.Cell().Background(bg).Padding(5).Text(item).FontSize(8.5f);
                                table.Cell().Background(bg).Padding(5).AlignCenter().Text(old).FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                                table.Cell().Background(bg).Padding(5).AlignCenter().Text(nw).FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                                table.Cell().Background(bg).Padding(5).AlignCenter().Text(usage).FontSize(8.5f);
                                table.Cell().Background(bg).Padding(5).AlignRight().Text(amount).Bold().FontSize(8.5f).FontColor(Colors.Blue.Darken2);
                            };

                            dataRow("Tiền phòng", "—", "—", "1 tháng", $"{invoice.RoomFee:N0} VND", false);
                            string electricUsageText = roommateCount > 1 
                                ? $"{electricConsumed} kWh (Chia {roommateCount})" 
                                : $"{electricConsumed} kWh";

                            string waterUsageText = roommateCount > 1 
                                ? $"{waterConsumed} m³ (Chia {roommateCount})" 
                                : $"{waterConsumed} m³";

                            dataRow(
                                "Điện",
                                electricUsage?.OldIndex.ToString() ?? "0",
                                electricUsage?.NewIndex.ToString() ?? "0",
                                electricUsageText,
                                $"{invoice.ElectricFee:N0} VND",
                                true
                            );
                            dataRow(
                                "Nước",
                                waterUsage?.OldIndex.ToString() ?? "0",
                                waterUsage?.NewIndex.ToString() ?? "0",
                                waterUsageText,
                                $"{invoice.WaterFee:N0} VND",
                                false
                            );

                            // Rác
                            if (room.GarbageFee > 0)
                            {
                                string garbageUsageText = roommateCount > 1 
                                    ? $"1 tháng (Chia {roommateCount})" 
                                    : "1 tháng";
                                dataRow("Phí rác", "—", "—", garbageUsageText, $"{garbageFeeShared:N0} VND", true);
                            }
                        });

                        // Tổng cộng
                        column.Item().PaddingTop(8).Row(row =>
                        {
                            row.RelativeItem();
                            row.AutoItem().Column(col =>
                            {
                                col.Item().Row(r =>
                                {
                                    r.AutoItem().Text("TỔNG CỘNG:").Bold().FontSize(11f).FontColor(Colors.Blue.Darken3);
                                    r.AutoItem().PaddingLeft(20).Text($"{invoice.TotalAmount:N0} VND").Bold().FontSize(12f).FontColor(Colors.Red.Darken2);
                                });
                                col.Item().PaddingTop(2).Text($"Hạn thanh toán: ngày 05/{invoice.BillingMonth}/{invoice.BillingYear}").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                col.Item().Text("Vui lòng chuyển khoản hoặc nộp tiền mặt tại văn phòng KTX.").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                            });
                        });

                        column.Item().PaddingTop(10).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);

                        // Chữ ký
                        column.Item().PaddingTop(12).Row(row =>
                        {
                            row.RelativeItem().AlignCenter().Column(sigA =>
                            {
                                sigA.Item().Text("ĐẠI DIỆN BAN QUẢN LÝ").Bold().FontSize(9f);
                                sigA.Item().Text("(Đã ký)").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                sigA.Item().PaddingTop(22).Text("SMARTDORM MANAGEMENT").Bold().FontSize(8.5f);
                            });
                            row.RelativeItem().AlignCenter().Column(sigB =>
                            {
                                sigB.Item().Text("NGƯỜI THUÊ XÁC NHẬN").Bold().FontSize(9f);
                                sigB.Item().Text("(Đã nhận)").Italic().FontSize(8f).FontColor(Colors.Grey.Darken1);
                                sigB.Item().PaddingTop(22).Text(tenant.FullName).Bold().FontSize(8.5f);
                            });
                        });
                    });
                });
            }).GeneratePdf();
        }
    }
}
