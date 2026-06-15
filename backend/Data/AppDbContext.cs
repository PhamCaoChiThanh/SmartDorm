using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SmartDorm.Api.Models;

namespace SmartDorm.Api.Data
{
    public class AppDbContext : DbContext
    {
        private readonly IHttpContextAccessor? _httpContextAccessor;

        public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor? httpContextAccessor = null) : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Tenant> Tenants { get; set; } = null!;
        public DbSet<Room> Rooms { get; set; } = null!;
        public DbSet<Contract> Contracts { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<UtilityUsage> UtilityUsages { get; set; } = null!;
        public DbSet<Vehicle> Vehicles { get; set; } = null!;
        public DbSet<RoomRequest> RoomRequests { get; set; } = null!;
        public DbSet<Maintenance> Maintenances { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<Deposit> Deposits { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure enums to be stored as strings in EF Core
            modelBuilder.Entity<User>()
                .Property(e => e.Role)
                .HasConversion<string>();

            modelBuilder.Entity<Room>()
                .Property(e => e.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Contract>()
                .Property(e => e.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Invoice>()
                .Property(e => e.Status)
                .HasConversion<string>();

            modelBuilder.Entity<UtilityUsage>()
                .Property(e => e.Type)
                .HasConversion<string>();

            modelBuilder.Entity<Vehicle>()
                .Property(e => e.Type)
                .HasConversion<string>();

            modelBuilder.Entity<RoomRequest>()
                .Property(e => e.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Maintenance>()
                .Property(e => e.Status)
                .HasConversion<string>();
        }

        public override int SaveChanges()
        {
            OnBeforeSaveChanges();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            OnBeforeSaveChanges();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private Guid? GetCurrentUserId()
        {
            try
            {
                var httpContext = _httpContextAccessor?.HttpContext;
                if (httpContext == null) return null;

                var userIdClaim = httpContext.User?.FindFirst(ClaimTypes.NameIdentifier) 
                                  ?? httpContext.User?.FindFirst("id")
                                  ?? httpContext.User?.FindFirst("sub");

                if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return userId;
                }
            }
            catch
            {
                // Fallback for migrations or non-HTTP threads
            }
            return null;
        }

        private void OnBeforeSaveChanges()
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new List<AuditLog>();
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                var newUserEntry = ChangeTracker.Entries().FirstOrDefault(e => e.State == EntityState.Added && e.Metadata.DisplayName() == "User");
                if (newUserEntry != null)
                {
                    var keyProperty = newUserEntry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
                    if (keyProperty != null)
                    {
                        userId = keyProperty.CurrentValue as Guid?;
                    }
                }
                else
                {
                    var newTenantEntry = ChangeTracker.Entries().FirstOrDefault(e => e.State == EntityState.Added && e.Metadata.DisplayName() == "Tenant");
                    if (newTenantEntry != null && newTenantEntry.Entity is Tenant tenant)
                    {
                        userId = tenant.UserId;
                    }
                }
            }

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditLog = new AuditLog
                {
                    UserId = userId,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                string entityDisplayName = entry.Metadata.DisplayName();
                
                // Set Entity Name and Entity ID
                auditLog.EntityName = entry.Metadata.GetTableName() ?? entityDisplayName;
                
                var keyProperty = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
                if (keyProperty != null)
                {
                    auditLog.EntityId = keyProperty.CurrentValue as Guid?;
                }

                // Set Action
                if (entry.State == EntityState.Added)
                {
                    if (entityDisplayName == "RoomRequest") auditLog.Action = "CREATE_REQUEST";
                    else if (entityDisplayName == "UtilityUsage") auditLog.Action = "CREATE_UTILITY";
                    else if (entityDisplayName == "Contract") auditLog.Action = "CREATE_CONTRACT";
                    else if (entityDisplayName == "Maintenance") auditLog.Action = "CREATE_MAINTENANCE";
                    else if (entityDisplayName == "Vehicle") auditLog.Action = "CREATE_VEHICLE";
                    else if (entityDisplayName == "Invoice") auditLog.Action = "CREATE_INVOICE";
                    else if (entityDisplayName == "Payment") auditLog.Action = "CREATE_PAYMENT";
                    else auditLog.Action = "CREATE_" + entityDisplayName.ToUpper();
                }
                else if (entry.State == EntityState.Deleted)
                {
                    auditLog.Action = "DELETE_" + entityDisplayName.ToUpper();
                }
                else if (entry.State == EntityState.Modified)
                {
                    if (entityDisplayName == "RoomRequest")
                    {
                        var statusProp = entry.Property("Status");
                        if (statusProp.IsModified)
                        {
                            var statusVal = statusProp.CurrentValue?.ToString();
                            if (statusVal == "APPROVED") auditLog.Action = "APPROVE_REQUEST";
                            else if (statusVal == "REJECTED") auditLog.Action = "REJECT_REQUEST";
                            else auditLog.Action = "UPDATE_REQUEST";
                        }
                        else
                        {
                            auditLog.Action = "UPDATE_REQUEST";
                        }
                    }
                    else if (entityDisplayName == "UtilityUsage") auditLog.Action = "UPDATE_UTILITY";
                    else if (entityDisplayName == "Maintenance") auditLog.Action = "UPDATE_MAINTENANCE";
                    else if (entityDisplayName == "Vehicle") auditLog.Action = "UPDATE_VEHICLE";
                    else if (entityDisplayName == "Invoice") auditLog.Action = "UPDATE_INVOICE";
                    else auditLog.Action = "UPDATE_" + entityDisplayName.ToUpper();
                }

                // Convert Old/New Values to JSON
                var oldValues = new Dictionary<string, object?>();
                var newValues = new Dictionary<string, object?>();

                foreach (var prop in entry.Properties)
                {
                    if (prop.Metadata.IsPrimaryKey()) continue;

                    if (entry.State == EntityState.Added)
                    {
                        newValues[prop.Metadata.Name] = prop.CurrentValue;
                    }
                    else if (entry.State == EntityState.Deleted)
                    {
                        oldValues[prop.Metadata.Name] = prop.OriginalValue;
                    }
                    else if (entry.State == EntityState.Modified && prop.IsModified)
                    {
                        oldValues[prop.Metadata.Name] = prop.OriginalValue;
                        newValues[prop.Metadata.Name] = prop.CurrentValue;
                    }
                }

                if (oldValues.Count > 0)
                    auditLog.OldValue = System.Text.Json.JsonSerializer.Serialize(oldValues);
                if (newValues.Count > 0)
                    auditLog.NewValue = System.Text.Json.JsonSerializer.Serialize(newValues);

                auditEntries.Add(auditLog);
            }

            if (auditEntries.Count > 0)
            {
                AuditLogs.AddRange(auditEntries);
            }
        }
    }
}
