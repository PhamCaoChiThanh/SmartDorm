using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using SmartDorm.Api.Data;
using SmartDorm.Api.Models;
using SmartDorm.Api.Services;
using Amazon.S3;
using SmartDorm.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Configure AWS Lambda Hosting
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// HttpContext Accessor for Audit Logging
builder.Services.AddHttpContextAccessor();

// Register Email Service
builder.Services.AddTransient<IEmailService, EmailService>();
builder.Services.AddTransient<IPdfService, PdfService>();
builder.Services.AddScoped<IOcrService, OcrService>();

// Database Connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure AWS S3 Client
var awsSection = builder.Configuration.GetSection("AWS");
var accessKey = awsSection["AccessKey"];
var secretKey = awsSection["SecretKey"];
var regionName = awsSection["Region"] ?? "ap-southeast-1";
var region = Amazon.RegionEndpoint.GetBySystemName(regionName);

IAmazonS3 s3Client;
if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey) && !accessKey.Contains("YOUR_AWS"))
{
    s3Client = new AmazonS3Client(accessKey, secretKey, region);
}
else
{
    s3Client = new AmazonS3Client(region);
}
builder.Services.AddSingleton<IAmazonS3>(s3Client);
builder.Services.AddSingleton<IBedrockService, BedrockService>();

// JWT Authentication Configuration
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "your_super_secret_key_that_is_at_least_32_characters_long_here";
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        context.Database.ExecuteSqlRaw("ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;");
        context.Database.ExecuteSqlRaw("ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error updating database schema: {ex.Message}");
    }
}

app.MapControllers();

// Root welcome endpoint
app.MapGet("/", () => Results.Text("SmartDorm C# Web API is running successfully!", "text/plain", System.Text.Encoding.UTF8));

// Health check endpoint
app.MapGet("/health", () => Results.Ok("OK"));

// Seed database & Ensure tables are created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
                comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating notifications table: {ex.Message}");
    }
}

app.Run();
