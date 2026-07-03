using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Microsoft.Extensions.Configuration;

namespace SmartDorm.Api.Services
{
    public interface IBedrockService
    {
        Task<string> GenerateDebtReminderAsync(string tenantName, string roomNumber, decimal amount, string billingPeriod, string paymentBehavior);
    }

    public class BedrockService : IBedrockService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _accessKey;
        private readonly string? _secretKey;
        private readonly string _region;

        public BedrockService(IConfiguration configuration)
        {
            _configuration = configuration;
            var awsSection = _configuration.GetSection("AWS");
            _accessKey = awsSection["AccessKey"];
            _secretKey = awsSection["SecretKey"];
            _region = awsSection["Region"] ?? "ap-southeast-1";
        }

        public async Task<string> GenerateDebtReminderAsync(string tenantName, string roomNumber, decimal amount, string billingPeriod, string paymentBehavior)
        {
            // First check if AWS credentials are configured or if it's the placeholder value
            bool isAwsConfigured = !string.IsNullOrEmpty(_accessKey) && 
                                   !string.IsNullOrEmpty(_secretKey) && 
                                   !_accessKey.Contains("YOUR_AWS") && 
                                   !_secretKey.Contains("YOUR_AWS");

            if (!isAwsConfigured)
            {
                Console.WriteLine("[BedrockService] AWS credentials not configured. Falling back to local rules-based reminder generator.");
                return GenerateLocalFallbackReminder(tenantName, roomNumber, amount, billingPeriod, paymentBehavior);
            }

            try
            {
                var regionEndpoint = RegionEndpoint.GetBySystemName(_region);
                using var bedrockClient = new AmazonBedrockRuntimeClient(_accessKey, _secretKey, regionEndpoint);

                string modelId = "anthropic.claude-3-haiku-20240307-v1:0";

                string prompt = $@"Bạn là trợ lý AI của ứng dụng quản lý ký túc xá SmartDorm.
Hãy viết một lời nhắc đóng tiền phòng ngắn gọn, tinh tế và lịch sự bằng tiếng Việt để gửi cho sinh viên.
Thông tin chi tiết:
- Tên sinh viên: {tenantName}
- Số phòng: {roomNumber}
- Hóa đơn tháng: {billingPeriod}
- Số tiền nợ: {amount:N0} VNĐ
- Lịch sử thanh toán của sinh viên này: {paymentBehavior} (GOOD_PAYER nghĩa là luôn đóng đúng hạn, LATE_PAYER nghĩa là thường đóng trễ hạn, STANDARD_PAYER nghĩa là bình thường).

Yêu cầu về giọng văn dựa trên lịch sử thanh toán:
- Nếu sinh viên là GOOD_PAYER: Dùng giọng văn cực kỳ nhẹ nhàng, cảm thông, cảm ơn họ vì luôn đóng tiền đúng hạn và nhắc nhở tinh tế rằng hóa đơn tháng này đang quá hạn.
- Nếu sinh viên là LATE_PAYER: Dùng giọng văn nghiêm túc, rõ ràng, đề nghị họ thanh toán đúng hạn để tránh các chế tài hoặc ảnh hưởng dịch vụ điện nước.
- Nếu sinh viên là STANDARD_PAYER: Dùng giọng văn lịch sự, chuyên nghiệp, nhắc nhở thông thường.

Hãy chỉ trả về nội dung của tin nhắn nhắc nợ (khoảng 3-5 câu), không thêm bất kỳ lời dẫn đề hay kết luận nào ngoài nội dung tin nhắn.";

                // Construct Claude 3 payload
                var payload = new
                {
                    anthropic_version = "bedrock-2023-05-31",
                    max_tokens = 500,
                    temperature = 0.7,
                    messages = new[]
                    {
                        new
                        {
                            role = "user",
                            content = new[]
                            {
                                new { type = "text", text = prompt }
                            }
                        }
                    }
                };

                string payloadJson = JsonSerializer.Serialize(payload);
                using var memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(payloadJson));

                var request = new InvokeModelRequest
                {
                    ModelId = modelId,
                    Body = memoryStream,
                    ContentType = "application/json",
                    Accept = "application/json"
                };

                var response = await bedrockClient.InvokeModelAsync(request);

                using var reader = new StreamReader(response.Body, Encoding.UTF8);
                string responseBody = await reader.ReadToEndAsync();

                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;
                if (root.TryGetProperty("content", out var contentArray) && contentArray.ValueKind == JsonValueKind.Array && contentArray.GetArrayLength() > 0)
                {
                    var firstContent = contentArray[0];
                    if (firstContent.TryGetProperty("text", out var textProp))
                    {
                        string result = textProp.GetString()?.Trim() ?? string.Empty;
                        if (!string.IsNullOrEmpty(result))
                        {
                            return result;
                        }
                    }
                }

                return GenerateLocalFallbackReminder(tenantName, roomNumber, amount, billingPeriod, paymentBehavior);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BedrockService] Error calling Bedrock: {ex.Message}. Falling back to local rules-based reminder generator.");
                return GenerateLocalFallbackReminder(tenantName, roomNumber, amount, billingPeriod, paymentBehavior);
            }
        }

        private string GenerateLocalFallbackReminder(string tenantName, string roomNumber, decimal amount, string billingPeriod, string paymentBehavior)
        {
            string amountStr = amount.ToString("N0");
            
            if (paymentBehavior == "GOOD_PAYER")
            {
                return $"Chào {tenantName} thân mến (phòng {roomNumber}),\n\n" +
                       $"Hệ thống ghi nhận hóa đơn tiền phòng tháng {billingPeriod} của bạn với số tiền {amountStr}đ hiện chưa được hoàn thành.\n\n" +
                       $"Cảm ơn bạn rất nhiều vì luôn là thành viên đóng phí đúng hạn suốt thời gian qua. Bạn vui lòng sắp xếp thời gian kiểm tra và thanh toán hóa đơn này sớm nhé. Chúc bạn một ngày học tập và làm việc thật tốt!\n\n" +
                       $"Trân trọng,\nSmartDorm.";
            }
            
            if (paymentBehavior == "LATE_PAYER")
            {
                return $"Chào {tenantName} (phòng {roomNumber}),\n\n" +
                       $"Thông báo nhắc nhở về hóa đơn tiền phòng tháng {billingPeriod} chưa thanh toán của bạn với số tiền là {amountStr}đ.\n\n" +
                       $"Hệ thống ghi nhận bạn có lịch sử thường xuyên đóng tiền muộn. Vui lòng hoàn thành nghĩa vụ thanh toán trong thời gian sớm nhất để tránh ảnh hưởng đến việc duy trì các dịch vụ tiện ích cũng như hợp đồng thuê phòng của bạn.\n\n" +
                       $"Yêu cầu từ Ban quản lý SmartDorm.";
            }

            // STANDARD_PAYER or default
            return $"Chào {tenantName} (phòng {roomNumber}),\n\n" +
                   $"SmartDorm gửi thông báo nhắc nhở về hóa đơn tiền phòng tháng {billingPeriod} chưa được thanh toán.\n\n" +
                   $"- Số tiền cần thanh toán: {amountStr}đ\n" +
                   $"Bạn vui lòng kiểm tra thông tin chi tiết trên trang cá nhân và tiến hành thanh toán hóa đơn sớm giúp Ban quản lý nhé.\n\n" +
                   $"Cảm ơn bạn,\nSmartDorm.";
        }
    }
}
