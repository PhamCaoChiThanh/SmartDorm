const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '123456',
  database: 'smart_dorm',
  port: 5432
});

const ddl = `
ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url TEXT;
`;

async function run() {
  try {
    console.log("Upgrading comments table for image_url...");
    await pool.query(ddl);
    console.log("Database upgraded successfully!");
  } catch (error) {
    console.error("Database upgrade failed:", error);
  } finally {
    await pool.end();
  }
}

run();
