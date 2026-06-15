using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SmartDorm.Api.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, byte[]? attachmentData = null, string? attachmentName = null);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, byte[]? attachmentData = null, string? attachmentName = null)
        {
            try
            {
                var section = _config.GetSection("SmtpSettings");
                var server = section["Server"];
                if (string.IsNullOrEmpty(server))
                {
                    _logger.LogWarning("SMTP Server is not configured. Email to {To} was skipped.", to);
                    return;
                }

                var port = int.Parse(section["Port"] ?? "587");
                var senderName = section["SenderName"] ?? "SmartDorm System";
                var senderEmail = section["SenderEmail"] ?? "";
                var username = section["Username"] ?? "";
                var password = section["Password"] ?? "";
                var enableSsl = bool.Parse(section["EnableSsl"] ?? "true");

                // Check if placeholder is still used
                if (username.Contains("your-email@gmail.com") || password.Contains("your-app-password"))
                {
                    _logger.LogWarning("SMTP credentials are placeholders. Email to {To} was skipped.", to);
                    return;
                }

                using var client = new SmtpClient(server, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = enableSsl
                };

                string finalBody = body;
                if (!body.Contains("<html>") && !body.Contains("<!DOCTYPE html>"))
                {
                    finalBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }}
        .content {{
            padding: 40px 30px;
            color: #334155;
            line-height: 1.6;
        }}
        .content h2 {{
            color: #1e293b;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 20px;
            font-weight: 700;
        }}
        .content p {{
            font-size: 15px;
            margin-bottom: 16px;
        }}
        .btn-container {{
            text-align: center;
            margin: 30px 0;
        }}
        .btn {{
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
        }}
        .footer p {{
            margin: 0;
            color: #94a3b8;
            font-size: 12px;
            font-style: italic;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>SMARTDORM</h1>
        </div>
        <div class='content'>
            <h2>{subject}</h2>
            {body}
        </div>
        <div class='footer'>
            <p>Đây là thư tự động từ hệ thống quản lý SmartDorm, vui lòng không trả lời thư này.</p>
        </div>
    </div>
</body>
</html>";
                }

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = finalBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(to);

                if (attachmentData != null && !string.IsNullOrEmpty(attachmentName))
                {
                    mailMessage.Attachments.Add(new Attachment(new MemoryStream(attachmentData), attachmentName, "application/pdf"));
                }

                _logger.LogInformation("Sending email to {To} with subject '{Subject}'...", to, subject);
                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Email sent successfully to {To}.", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To} with subject '{Subject}'.", to, subject);
            }
        }
    }
}
