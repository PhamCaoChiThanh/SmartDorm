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
      UPDATE invoices
      SET contract_id = 'ebda69c4-6663-4c1f-bdcc-41a0862742a0'
      WHERE id = 'c8dd3ec1-8e64-43a3-b2db-6161333ada17'
    `);
    console.log('Update result:', res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
