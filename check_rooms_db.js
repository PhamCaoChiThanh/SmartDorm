const { Pool } = require('pg');
require('dotenv').config();

const run = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'smartdorm',
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`SELECT id, room_number, status, capacity FROM rooms WHERE room_number = 'A21';`);
    console.log('Room A21 database record:', res.rows[0]);

    const activeContracts = await pool.query(`SELECT COUNT(*) FROM contracts WHERE room_id = $1 AND status = 'ACTIVE';`, [res.rows[0].id]);
    console.log('Active contracts count:', activeContracts.rows[0].count);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
