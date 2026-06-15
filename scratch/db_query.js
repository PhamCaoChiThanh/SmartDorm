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
    const requests = await pool.query(`
      SELECT rr.id, rr.status, rr.move_in_date, rr.note, rr.created_at,
             t.full_name as tenant_name,
             r.room_number
      FROM room_requests rr
      LEFT JOIN tenants t ON t.id = rr.tenant_id
      LEFT JOIN rooms r ON r.id = rr.room_id
      ORDER BY rr.created_at DESC
    `);
    console.log("--- ROOM REQUESTS IN DB ---");
    console.table(requests.rows);
    console.log(`Total: ${requests.rows.length} requests`);
  } catch (err) {
    console.error("Error querying DB:", err.message);
  } finally {
    await pool.end();
  }
}
main();
