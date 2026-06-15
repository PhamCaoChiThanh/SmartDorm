const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log(`Hashing password "${password}"...`);
    console.log(`Generated hash: ${hash}`);

    // Update admin
    const res = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE username = 'admin'",
      [hash]
    );
    console.log(`Successfully updated password for ${res.rowCount} users.`);
  } catch (err) {
    console.error("Error resetting passwords:", err);
  } finally {
    await pool.end();
  }
}

main();
