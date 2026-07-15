---
title: "5.3 Database Setup"
date: 2026-07-10
weight: 3
chapter: false
---

## 5.3 Database Design & EF Core Setup

This step details setting up the relational PostgreSQL database tables using Entity Framework Core.

### 1. Database Relations (ERD Schema)
We establish the following database tables:
*   `Rooms`: Tracks room numbers and occupied statuses.
*   `Tenants`: Holds student names, phones, and email parameters.
*   `Contracts`: Joins Room and Tenant entities to define lease terms.
*   `UtilityUsages`: Records beginning and ending utility indexes.
*   `Invoices`: Compiles monthly financial statements.

### 2. Entity Framework DbContext Setup (`SmartDormDbContext.cs`)
Define EF Core mapping classes:
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

### 3. Run Database Migrations
Execute migration scripts locally inside your terminal:
```bash
# Create migration script
dotnet ef migrations add InitialCreate

# Apply schema structures to PostgreSQL
dotnet ef database update
```
