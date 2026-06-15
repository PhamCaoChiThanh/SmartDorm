const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', user:'postgres', password:'Chithanh123@', database:'smartdorm', port:5432 });

async function main() {
  try {
    const roomsRes = await pool.query(`
      SELECT r.id, r.room_number, r.capacity, r.status,
             (SELECT COUNT(*) FROM contracts c WHERE c.room_id = r.id AND c.status = 'ACTIVE') as active_contracts
      FROM rooms r
      ORDER BY r.room_number
    `);
    
    console.log("DANH SÁCH PHÒNG:");
    console.table(roomsRes.rows);
  } catch (err) {
    console.error("Lỗi:", err.message);
  } finally {
    await pool.end();
  }
}
main();
