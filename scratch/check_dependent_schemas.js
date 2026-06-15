const { Pool } = require('pg');
require('dotenv').config({ path: 'm:/SmartDorm/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Chithanh123@',
  database: process.env.DB_NAME || 'smartdorm',
  port: process.env.DB_PORT || 5432,
});

async function main() {
  try {
    const tables = [
      'utility_usages', 'deposits', 'parking_registrations', 
      'parking_invoices', 'parking_payments', 'deposit_transactions'
    ];
    for (const table of tables) {
      const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      console.log(`\n--- TABLE: ${table} ---`);
      console.log(cols.rows.map(r => `${r.column_name} (${r.data_type})`));
    }
  } catch (err) {
    console.error("Error querying DB:", err);
  } finally {
    await pool.end();
  }
}

main();
