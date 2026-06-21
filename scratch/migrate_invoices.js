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
    await pool.query(`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
    `);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
