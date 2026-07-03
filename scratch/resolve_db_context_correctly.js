const fs = require('fs');

const dbContextPath = 'm:/SmartDorm/backend/Data/AppDbContext.cs';
let content = fs.readFileSync(dbContextPath, 'utf8');

// Insert DbSets
const targetDbSet = 'public DbSet<DepositTransaction> DepositTransactions { get; set; } = null!;';
const dbSetsToAdd = `\n        public DbSet<Post> Posts { get; set; } = null!;
        public DbSet<PostLike> PostLikes { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!;
        public DbSet<CommentLike> CommentLikes { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;`;

content = content.replace(targetDbSet, targetDbSet + dbSetsToAdd);

// Insert composite keys before the closing brace of OnModelCreating
const targetOnModelCreatingEnd = `            modelBuilder.Entity<ParkingInvoice>()
                .Property(e => e.Status)
                .HasConversion<string>();
        }`;

const compositeKeysToAdd = `            modelBuilder.Entity<ParkingInvoice>()
                .Property(e => e.Status)
                .HasConversion<string>();

            // Configure composite key for PostLike
            modelBuilder.Entity<PostLike>()
                .HasKey(pl => new { pl.PostId, pl.UserId });

            // Configure composite key for CommentLike
            modelBuilder.Entity<CommentLike>()
                .HasKey(cl => new { cl.CommentId, cl.UserId });
        }`;

content = content.replace(targetOnModelCreatingEnd, compositeKeysToAdd);

fs.writeFileSync(dbContextPath, content, 'utf8');
console.log('AppDbContext.cs updated with origin/tri DbSets and configuration!');
