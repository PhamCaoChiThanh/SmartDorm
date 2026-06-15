const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Chithanh123@',
  database: process.env.DB_NAME || 'smartdorm',
  port: process.env.DB_PORT || 5432,
});

async function main() {
  try {
    console.log("Generating real invoices in database...");
    
    // 1. Clear existing invoices to ensure a clean state
    await pool.query("DELETE FROM invoices");
    console.log("Cleared existing invoices.");

    // 2. Fetch contracts
    const contractsRes = await pool.query("SELECT * FROM contracts WHERE status = 'ACTIVE'");
    console.log(`Found ${contractsRes.rows.length} active contracts.`);

    for (const contract of contractsRes.rows) {
      // Find room details
      const roomRes = await pool.query("SELECT * FROM rooms WHERE id = $1", [contract.room_id]);
      if (roomRes.rows.length === 0) continue;
      const room = roomRes.rows[0];

      // Find utility usages for Month 4, Year 2025
      const utilitiesRes = await pool.query(
        "SELECT * FROM utility_usages WHERE room_id = $1 AND billing_month = 4 AND billing_year = 2025",
        [contract.room_id]
      );

      let electricFee = 0;
      let waterFee = 0;

      for (const util of utilitiesRes.rows) {
        const consumption = util.new_index - util.old_index;
        if (util.type === 'ELECTRIC') {
          electricFee = consumption * Number(room.electricity_price);
        } else if (util.type === 'WATER') {
          waterFee = consumption * Number(room.water_price);
        }
      }

      const roomFee = Number(room.base_price);
      const totalAmount = roomFee + electricFee + waterFee;

      // Insert invoice
      await pool.query(`
        INSERT INTO invoices (
          id, contract_id, billing_month, billing_year, 
          room_fee, electric_fee, water_fee, total_amount, 
          paid_amount, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, 4, 2025, 
          $2, $3, $4, $5, 
          0, 'PENDING', NOW(), NOW()
        )
      `, [contract.id, roomFee, electricFee, waterFee, totalAmount]);

      console.log(`Generated invoice for Room ${room.room_number}: Total = ${totalAmount}`);
    }

    console.log("Finished generating real invoices.");
  } catch (err) {
    console.error("Error generating invoices:", err);
  } finally {
    await pool.end();
  }
}

main();
