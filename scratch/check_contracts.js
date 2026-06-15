const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', user:'postgres', password:'Chithanh123@', database:'smartdorm', port:5432 });

async function main() {
  try {
    const res = await pool.query(`
      SELECT c.*, t.full_name 
      FROM contracts c
      JOIN tenants t ON c.tenant_id = t.id
      WHERE c.room_id = '2edd21db-3802-4d7c-8a44-6a4c3c970f94'
    `);
    console.log("Contracts for Room A1:");
    console.table(res.rows);
  } catch (err) {
    console.error("Lỗi:", err.message);
  } finally {
    await pool.end();
  }
}
main();
