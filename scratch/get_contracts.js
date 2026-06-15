const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'smartdorm',
  user: 'postgres',
  password: 'Chithanh123@',
  port: 5432,
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT c.id, c.room_id, r.room_number, c.status
      FROM contracts c
      JOIN rooms r ON c.room_id = r.id
      WHERE c.status = 'ACTIVE'
    `);
    console.log('Contracts in DB:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
