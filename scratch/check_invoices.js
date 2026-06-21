const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: 'localhost',
  database: 'smartdorm',
  user: 'postgres',
  password: 'Chithanh123@',
  port: 5432,
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT i.id, i.contract_id, i.billing_month, i.billing_year, i.total_amount,
             c.room_id, r.room_number, c.tenant_id, t.full_name, t.email
      FROM invoices i
      JOIN contracts c ON i.contract_id = c.id
      JOIN rooms r ON c.room_id = r.id
      JOIN tenants t ON c.tenant_id = t.id
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
