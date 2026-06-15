const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', user:'postgres', password:'Chithanh123@', database:'smartdorm', port:5432 });

async function main() {
  try {
    console.log("Đang chuyển đổi các cột status từ ENUM sang TEXT...");

    // Convert all enum status columns to text so EF Core HasConversion<string>() works
    const alterStatements = [
      // contracts
      "ALTER TABLE contracts ALTER COLUMN status TYPE TEXT USING status::text",
      // invoices
      "ALTER TABLE invoices ALTER COLUMN status TYPE TEXT USING status::text",
      // room_requests
      "ALTER TABLE room_requests ALTER COLUMN status TYPE TEXT USING status::text",
      // rooms
      "ALTER TABLE rooms ALTER COLUMN status TYPE TEXT USING status::text",
      // maintenances (if exists)
      "ALTER TABLE maintenances ALTER COLUMN status TYPE TEXT USING status::text",
      // users role
      "ALTER TABLE users ALTER COLUMN role TYPE TEXT USING role::text",
      // vehicles type
      "ALTER TABLE vehicles ALTER COLUMN type TYPE TEXT USING type::text",
      // utility_usages type
      "ALTER TABLE utility_usages ALTER COLUMN type TYPE TEXT USING type::text",
    ];

    for (const sql of alterStatements) {
      try {
        await pool.query(sql);
        console.log("✅", sql.substring(0, 60) + "...");
      } catch (e) {
        // If column already TEXT or table doesn't exist, skip
        if (e.message.includes('does not exist') || e.message.includes('already') || e.message.includes('cannot')) {
          console.log("⏭️  Bỏ qua:", e.message.substring(0, 80));
        } else {
          console.error("❌ Lỗi:", e.message);
        }
      }
    }

    console.log("\n✅ Hoàn thành! Kiểm tra bằng cách duyệt yêu cầu trong admin.");
  } catch (err) {
    console.error("Lỗi:", err.message);
  } finally {
    await pool.end();
  }
}
main();
