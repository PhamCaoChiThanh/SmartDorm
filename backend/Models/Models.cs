using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartDorm.Api.Models
{
    public enum UserRole
    {
        ADMIN,
        MANAGER,
        TENANT
    }

    public enum RoomStatus
    {
        AVAILABLE,
        OCCUPIED,
        MAINTENANCE
    }

    public enum ContractStatus
    {
        ACTIVE,
        EXPIRED,
        TERMINATED
    }

    public enum InvoiceStatus
    {
        PENDING,
        PAID,
        OVERDUE
    }

    public enum UtilityType
    {
        WATER,
        ELECTRIC
    }

    public enum VehicleType
    {
        BICYCLE,
        MOTORBIKE,
        CAR
    }

    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("username")]
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Column("email")]
        [MaxLength(100)]
        public string? Email { get; set; }

        [Column("password_hash")]
        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Column("role")]
        [Required]
        public UserRole Role { get; set; } = UserRole.TENANT;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("tenants")]
    public class Tenant
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("user_id")]
        public Guid? UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        [Column("full_name")]
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Column("cccd")]
        [Required]
        [MaxLength(20)]
        public string Cccd { get; set; } = string.Empty;

        [Column("phone")]
        [MaxLength(20)]
        public string? Phone { get; set; }

        [Column("email")]
        [MaxLength(100)]
        public string? Email { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("rooms")]
    public class Room
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("room_number")]
        [Required]
        [MaxLength(20)]
        public string RoomNumber { get; set; } = string.Empty;

        [Column("capacity")]
        public int Capacity { get; set; }

        [Column("status")]
        public RoomStatus Status { get; set; } = RoomStatus.AVAILABLE;

        [Column("base_price")]
        public decimal BasePrice { get; set; }

        [Column("garbage_fee")]
        public decimal GarbageFee { get; set; } = 0;

        [Column("electricity_price")]
        public decimal ElectricityPrice { get; set; }

        [Column("water_price")]
        public decimal WaterPrice { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("contracts")]
    public class Contract
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("tenant_id")]
        public Guid? TenantId { get; set; }

        [ForeignKey(nameof(TenantId))]
        public Tenant? Tenant { get; set; }

        [Column("room_id")]
        public Guid? RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }

        [Column("start_date")]
        public DateOnly StartDate { get; set; }

        [Column("end_date")]
        public DateOnly EndDate { get; set; }

        [Column("status")]
        public ContractStatus Status { get; set; } = ContractStatus.ACTIVE;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("deposits")]
    public class Deposit
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("contract_id")]
        public Guid? ContractId { get; set; }

        [ForeignKey(nameof(ContractId))]
        public Contract? Contract { get; set; }

        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        [Column("remaining_balance")]
        public decimal RemainingBalance { get; set; }

        [Column("status")]
        public string Status { get; set; } = "HOLDING";

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("invoices")]
    public class Invoice
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("contract_id")]
        public Guid? ContractId { get; set; }

        [ForeignKey(nameof(ContractId))]
        public Contract? Contract { get; set; }

        [Column("billing_month")]
        public int BillingMonth { get; set; }

        [Column("billing_year")]
        public int BillingYear { get; set; }

        [Column("room_fee")]
        public decimal? RoomFee { get; set; }

        [Column("electric_fee")]
        public decimal? ElectricFee { get; set; }

        [Column("water_fee")]
        public decimal? WaterFee { get; set; }

        [Column("total_amount")]
        public decimal? TotalAmount { get; set; }

        [Column("paid_amount")]
        public decimal PaidAmount { get; set; } = 0;

        [Column("status")]
        public InvoiceStatus Status { get; set; } = InvoiceStatus.PENDING;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("invoice_id")]
        public Guid? InvoiceId { get; set; }

        [ForeignKey(nameof(InvoiceId))]
        public Invoice? Invoice { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("payment_method")]
        [MaxLength(50)]
        public string? PaymentMethod { get; set; }

        [Column("payment_date")]
        public DateTimeOffset PaymentDate { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("utility_usages")]
    public class UtilityUsage
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("room_id")]
        public Guid? RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }

        [Column("type")]
        public UtilityType Type { get; set; }

        [Column("billing_month")]
        public int BillingMonth { get; set; }

        [Column("billing_year")]
        public int BillingYear { get; set; }

        [Column("old_index")]
        public int OldIndex { get; set; }

        [Column("new_index")]
        public int NewIndex { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("vehicles")]
    public class Vehicle
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("tenant_id")]
        public Guid? TenantId { get; set; }

        [ForeignKey(nameof(TenantId))]
        public Tenant? Tenant { get; set; }

        [Column("license_plate")]
        [Required]
        [MaxLength(20)]
        public string LicensePlate { get; set; } = string.Empty;

        [Column("vehicle_model")]
        [MaxLength(50)]
        public string? VehicleModel { get; set; }

        [Column("type")]
        public VehicleType Type { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public enum RequestStatus
    {
        PENDING,
        APPROVED,
        REJECTED
    }

    public enum MaintenanceStatus
    {
        OPEN,
        IN_PROGRESS,
        DONE
    }

    [Table("room_requests")]
    public class RoomRequest
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("tenant_id")]
        public Guid? TenantId { get; set; }

        [ForeignKey(nameof(TenantId))]
        public Tenant? Tenant { get; set; }

        [Column("room_id")]
        public Guid? RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }

        [Column("note")]
        public string? Note { get; set; }

        [Column("move_in_date")]
        public DateOnly? MoveInDate { get; set; }

        [Column("status")]
        public RequestStatus Status { get; set; } = RequestStatus.PENDING;

        [Column("admin_note")]
        public string? AdminNote { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("maintenances")]
    public class Maintenance
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("room_id")]
        public Guid? RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }

        [Column("reported_by")]
        public Guid? ReportedBy { get; set; }

        [ForeignKey(nameof(ReportedBy))]
        public Tenant? Tenant { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("status")]
        public MaintenanceStatus Status { get; set; } = MaintenanceStatus.OPEN;

        [Column("assigned_to")]
        [MaxLength(100)]
        public string? AssignedTo { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("audit_logs")]
    public class AuditLog
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("user_id")]
        public Guid? UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        [Column("action")]
        [Required]
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty;

        [Column("entity_name")]
        [Required]
        [MaxLength(100)]
        public string EntityName { get; set; } = string.Empty;

        [Column("entity_id")]
        public Guid? EntityId { get; set; }

        [Column("old_value", TypeName = "jsonb")]
        public string? OldValue { get; set; }

        [Column("new_value", TypeName = "jsonb")]
        public string? NewValue { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
