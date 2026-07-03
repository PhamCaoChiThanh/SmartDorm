const fs = require('fs');

const dbContextPath = 'm:/SmartDorm/backend/Data/AppDbContext.cs';
let content = fs.readFileSync(dbContextPath, 'utf8');

// The first conflict is already solved in the previous turn by tool! 
// Let's verify if there is still conflict in AppDbContext.cs.

if (content.includes('<<<<<<< HEAD')) {
  // Let's locate the conflict block starting around line 81
  // We want to replace:
  // <<<<<<< HEAD
  // ... HEAD content ...
  // =======
  // ... TRI content ...
  // >>>>>>> origin/tri
  
  // Specifically:
  // In the HEAD part, it has:
  //             modelBuilder.Entity<ParkingRegistration>()
  //                 .Property(e => e.TicketType)
  //                 .HasConversion<string>();
  // 
  //             modelBuilder.Entity<ParkingRegistration>()
  //                 .Property(e => e.Status)
  //                 .HasConversion<string>();
  // 
  //             modelBuilder.Entity<ParkingInvoice>()
  //                 .Property(e => e.Status)
  //                 .HasConversion<string>();
  //         }
  //
  //         ... SaveChanges ...
  //         ... GetCurrentUserId ...
  //         ... OnBeforeSaveChanges ...
  //
  // In TRI part, it has:
  //             // Configure composite key for PostLike
  //             modelBuilder.Entity<PostLike>()
  //                 .HasKey(pl => new { pl.PostId, pl.UserId });
  // 
  //             // Configure composite key for CommentLike
  //             modelBuilder.Entity<CommentLike>()
  //                 .HasKey(cl => new { cl.CommentId, cl.UserId });
  
  // So the resolved content is:
  // 1. Keep the properties config for Parking
  // 2. Insert composite keys config for PostLike/CommentLike
  // 3. Close the OnModelCreating method: }
  // 4. Put the rest of SaveChanges, GetCurrentUserId, OnBeforeSaveChanges methods
  
  const triCompositeKeys = `            // Configure composite key for PostLike
            modelBuilder.Entity<PostLike>()
                .HasKey(pl => new { pl.PostId, pl.UserId });

            // Configure composite key for CommentLike
            modelBuilder.Entity<CommentLike>()
                .HasKey(cl => new { cl.CommentId, cl.UserId });`;

  // We can do it by finding the start of the conflict, extracting the parts and reconstructing.
  // Or we can just read the file, locate:
  const targetStart = content.indexOf('<<<<<<< HEAD');
  const targetSeparator = content.indexOf('=======', targetStart);
  const targetEnd = content.indexOf('>>>>>>> origin/tri', targetSeparator);
  
  if (targetStart !== -1 && targetSeparator !== -1 && targetEnd !== -1) {
    const headPart = content.slice(targetStart + 12, targetSeparator).trim();
    // remove the last closing bracket '}' from the OnModelCreating in headPart because we want to inject triCompositeKeys before it.
    // Let's find the last '}' in headPart.
    const lastBracketIdx = headPart.lastIndexOf('}');
    if (lastBracketIdx !== -1) {
      const beforeBracket = headPart.slice(0, lastBracketIdx);
      const afterBracket = headPart.slice(lastBracketIdx + 1);
      
      const resolvedPart = beforeBracket + '\n' + triCompositeKeys + '\n        }' + afterBracket;
      
      content = content.slice(0, targetStart) + resolvedPart + content.slice(targetEnd + 18);
      fs.writeFileSync(dbContextPath, content, 'utf8');
      console.log('AppDbContext.cs conflicts resolved successfully!');
    } else {
      console.log('Failed to find closing bracket in HEAD part of conflict.');
    }
  }
} else {
  console.log('No conflict markers found in AppDbContext.cs');
}
