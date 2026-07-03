const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '123456',
  database: 'smart_dorm',
  port: 5432
});

const queries = [
  // users
  "ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text",
  
  // rooms
  "ALTER TABLE rooms ALTER COLUMN status DROP DEFAULT",
  "ALTER TABLE rooms ALTER COLUMN status TYPE VARCHAR(50) USING status::text",
  "ALTER TABLE rooms ALTER COLUMN status SET DEFAULT 'AVAILABLE'",

  // contracts
  "ALTER TABLE contracts ALTER COLUMN status DROP DEFAULT",
  "ALTER TABLE contracts ALTER COLUMN status TYPE VARCHAR(50) USING status::text",
  "ALTER TABLE contracts ALTER COLUMN status SET DEFAULT 'ACTIVE'",

  // invoices
  "ALTER TABLE invoices ALTER COLUMN status DROP DEFAULT",
  "ALTER TABLE invoices ALTER COLUMN status TYPE VARCHAR(50) USING status::text",
  "ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'PENDING'",

  // utility_usages
  "ALTER TABLE utility_usages ALTER COLUMN type TYPE VARCHAR(50) USING type::text",

  // vehicles
  "ALTER TABLE vehicles ALTER COLUMN type TYPE VARCHAR(50) USING type::text",

  // room_requests
  "ALTER TABLE room_requests ALTER COLUMN status DROP DEFAULT",
  "ALTER TABLE room_requests ALTER COLUMN status TYPE VARCHAR(50) USING status::text",
  "ALTER TABLE room_requests ALTER COLUMN status SET DEFAULT 'PENDING'",

  // maintenances
  "ALTER TABLE maintenances ALTER COLUMN status DROP DEFAULT",
  "ALTER TABLE maintenances ALTER COLUMN status TYPE VARCHAR(50) USING status::text",
  "ALTER TABLE maintenances ALTER COLUMN status SET DEFAULT 'OPEN'"
];

async function run() {
  try {
    for (const sql of queries) {
      console.log(`Executing: ${sql}`);
      await pool.query(sql);
    }
    console.log("All enums migrated to VARCHAR successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

run();
