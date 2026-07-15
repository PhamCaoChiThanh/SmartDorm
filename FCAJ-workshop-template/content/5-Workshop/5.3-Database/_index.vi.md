---
title: "5.3 Thiết kế Database"
date: 2026-07-10
weight: 3
chapter: false
---

## 5.3 Thiết kế Cơ sở dữ liệu PostgreSQL & cấu hình EF Core

Bước này hướng dẫn thiết lập cấu trúc CSDL PostgreSQL và sử dụng Entity Framework Core để quản lý migration.

### 1. Sơ đồ cơ sở dữ liệu quan hệ (ERD Schema)
Các bảng quan hệ chính được thiết kế để liên kết chặt chẽ:
*   `Rooms`: Quản lý thông tin và trạng thái phòng.
*   `Tenants`: Lưu trữ thông tin cá nhân và định danh của khách thuê.
*   `Contracts`: Quản lý thời hạn và giá trị hợp đồng thuê phòng giữa Tenant và Room.
*   `UtilityUsages`: Ghi nhận chỉ số điện nước hàng tháng.
*   `Invoices`: Hóa đơn tính toán tiền phòng và điện nước tiêu thụ thực tế.

### 2. Cấu hình DbContext trong Backend (`SmartDormDbContext.cs`)
Tạo tệp cơ sở dữ liệu EF Core để ánh xạ các Class Models thành các bảng:
```csharp
using Microsoft.EntityFrameworkCore;
using SmartDorm.Api.Models;

namespace SmartDorm.Api.Data
{
    public class SmartDormDbContext : DbContext
    {
        public SmartDormDbContext(DbContextOptions<SmartDormDbContext> options) : base(options) {}

        public DbSet<Room> Rooms { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<UtilityUsage> UtilityUsages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Cấu hình các mối quan hệ khóa ngoại (Fluent API)
            modelBuilder.Entity<Contract>()
                .HasOne(c => c.Room)
                .WithMany()
                .HasForeignKey(c => c.RoomId);

            modelBuilder.Entity<Contract>()
                .HasOne(c => c.Tenant)
                .WithMany()
                .HasForeignKey(c => c.TenantId);
        }
    }
}
```

### 3. Chạy các câu lệnh tạo Database (Migrations)
Mở terminal tại thư mục backend và chạy lệnh để sinh mã SQL khởi tạo CSDL PostgreSQL:
```bash
# Tạo bản ghi Migration
dotnet ef migrations add InitialCreate

# Cập nhật cấu trúc bảng trực tiếp vào database
dotnet ef database update
```
