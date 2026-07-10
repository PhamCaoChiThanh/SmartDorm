const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'smartdorm',
  user: 'postgres',
  password: 'Chithanh123@',
  port: 5432,
});

async function check() {
  try {
    const usages = await pool.query('SELECT * FROM utility_usages');
    console.log("Utility Usages:", JSON.stringify(usages.rows, null, 2));
    
    const rooms = await pool.query('SELECT * FROM rooms WHERE id = \'2edd21db-3802-4d7c-8a44-6a4c3c970f94\'');
    console.log("Room details:", JSON.stringify(rooms.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
check();
