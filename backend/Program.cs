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
using Amazon.S3;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Root welcome endpoint
app.MapGet("/", () => Results.Text("SmartDorm C# Web API is running successfully!", "text/plain", System.Text.Encoding.UTF8));

// Health check endpoint
app.MapGet("/health", () => Results.Ok("OK"));

// Seed database

app.Run();
