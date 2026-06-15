const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', user:'postgres', password:'Chithanh123@', database:'smartdorm', port:5432 });

async function main() {
  // Check all custom enum types
  const enums = await pool.query(`
    SELECT t.typname, e.enumlabel 
    FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    ORDER BY t.typname, e.enumsortorder
  `);
  console.log("--- DB ENUM TYPES ---");
  console.table(enums.rows);

  // Check room_requests status column type too
  const reqSchema = await pool.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns 
    WHERE table_name IN ('room_requests', 'contracts', 'invoices')
    AND column_name = 'status'
  `);
  console.log("\n--- STATUS COLUMN TYPES ---");
  console.table(reqSchema.rows);
  pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
