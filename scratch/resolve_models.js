const fs = require('fs');

const filePath = 'm:/SmartDorm/backend/Models/Models.cs';
const content = fs.readFileSync(filePath, 'utf8');

const targetIndex = content.indexOf('<<<<<<< HEAD');
if (targetIndex === -1) {
  console.log('No conflict markers in Models.cs');
  process.exit(0);
}

const beforeConflict = content.slice(0, targetIndex);

const mergedClasses = `    public enum ParkingTicketType
    {
        MONTHLY,
        DAILY
    }

    [Table("parking_registrations")]
    public class ParkingRegistration
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("vehicle_id")]
        public Guid? VehicleId { get; set; }

        [ForeignKey(nameof(VehicleId))]
        public Vehicle? Vehicle { get; set; }

        [Column("tenant_id")]
        public Guid? TenantId { get; set; }

        [ForeignKey(nameof(TenantId))]
        public Tenant? Tenant { get; set; }

        [Column("ticket_type")]
        public ParkingTicketType TicketType { get; set; } = ParkingTicketType.MONTHLY;

        [Column("start_date")]
        public DateOnly StartDate { get; set; }

        [Column("end_date")]
        public DateOnly? EndDate { get; set; }

        [Column("fee_per_period")]
        public decimal FeePerPeriod { get; set; }

        [Column("status")]
        public RequestStatus Status { get; set; } = RequestStatus.PENDING;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("posts")]
    public class Post
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("user_id")]
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        [Column("content")]
        [Required]
        public string Content { get; set; } = string.Empty;

        [Column("image_url")]
        public string? ImageUrl { get; set; }

        [Column("likes_count")]
        public int LikesCount { get; set; } = 0;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("parking_invoices")]
    public class ParkingInvoice
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("registration_id")]
        public Guid? RegistrationId { get; set; }

        [ForeignKey(nameof(RegistrationId))]
        public ParkingRegistration? Registration { get; set; }

        [Column("billing_month")]
        public int? BillingMonth { get; set; }

        [Column("billing_year")]
        public int? BillingYear { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("status")]
        public InvoiceStatus Status { get; set; } = InvoiceStatus.PENDING;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("parking_payments")]
    public class ParkingPayment
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("parking_invoice_id")]
        public Guid? ParkingInvoiceId { get; set; }

        [ForeignKey(nameof(ParkingInvoiceId))]
        public ParkingInvoice? ParkingInvoice { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("payment_method")]
        [MaxLength(50)]
        public string? PaymentMethod { get; set; }

        [Column("payment_date")]
        public DateTimeOffset PaymentDate { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("deposit_transactions")]
    public class DepositTransaction
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("deposit_id")]
        public Guid? DepositId { get; set; }

        [ForeignKey(nameof(DepositId))]
        public Deposit? Deposit { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("transaction_type")]
        [MaxLength(50)]
        public string? TransactionType { get; set; }

        [Column("reason")]
        public string? Reason { get; set; }
    }

    [Table("post_likes")]
    public class PostLike
    {
        [Column("post_id")]
        public Guid PostId { get; set; }

        [ForeignKey(nameof(PostId))]
        public Post? Post { get; set; }

        [Column("user_id")]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }

    [Table("comments")]
    public class Comment
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("post_id")]
        [Required]
        public Guid PostId { get; set; }

        [ForeignKey(nameof(PostId))]
        public Post? Post { get; set; }

        [Column("user_id")]
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        [Column("content")]
        [Required]
        public string Content { get; set; } = string.Empty;

        [Column("parent_id")]
        public Guid? ParentId { get; set; }

        [ForeignKey(nameof(ParentId))]
        public Comment? Parent { get; set; }

        [Column("likes_count")]
        public int LikesCount { get; set; } = 0;

        [Column("image_url")]
        public string? ImageUrl { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [Table("comment_likes")]
    public class CommentLike
    {
        [Column("comment_id")]
        public Guid CommentId { get; set; }

        [ForeignKey(nameof(CommentId))]
        public Comment? Comment { get; set; }

        [Column("user_id")]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }

    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("recipient_id")]
        [Required]
        public Guid RecipientId { get; set; }

        [ForeignKey(nameof(RecipientId))]
        public User? Recipient { get; set; }

        [Column("sender_id")]
        [Required]
        public Guid SenderId { get; set; }

        [ForeignKey(nameof(SenderId))]
        public User? Sender { get; set; }

        [Column("type")]
        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // LIKE_POST, COMMENT_POST, REPLY_COMMENT

        [Column("post_id")]
        public Guid? PostId { get; set; }

        [ForeignKey(nameof(PostId))]
        public Post? Post { get; set; }

        [Column("comment_id")]
        public Guid? CommentId { get; set; }

        [ForeignKey(nameof(CommentId))]
        public Comment? Comment { get; set; }

        [Column("content")]
        [Required]
        public string Content { get; set; } = string.Empty;

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
`;

fs.writeFileSync(filePath, beforeConflict + mergedClasses, 'utf8');
console.log('Models.cs conflicts resolved successfully!');
