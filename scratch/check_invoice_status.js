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
    const res = await pool.query('SELECT id, status, payment_date, sent_at FROM invoices');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
