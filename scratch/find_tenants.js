const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '123456',
  database: 'smart_dorm',
  port: 5432
});

async function run() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('123456', salt);
  await pool.query("UPDATE users SET password_hash = $1 WHERE username = 'testtenant';", [hash]);
  console.log("Updated testtenant password to 123456");
  await pool.end();
}
run();
