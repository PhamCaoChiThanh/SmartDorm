const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', user:'postgres', password:'Chithanh123@', database:'smartdorm', port:5432 });

async function main() {
  try {
    console.log("Đang sửa đổi trạng thái phòng bị lệch trong cơ sở dữ liệu...");
    
    // 1. Chuyển OCCUPIED sang AVAILABLE nếu số hợp đồng hoạt động < sức chứa
    const res1 = await pool.query(`
      UPDATE rooms r
      SET status = 'AVAILABLE', updated_at = now()
      WHERE r.status = 'OCCUPIED'
        AND (SELECT COUNT(*) FROM contracts c WHERE c.room_id = r.id AND c.status = 'ACTIVE') < r.capacity
      RETURNING r.room_number
    `);
    console.log(`Đã chuyển ${res1.rowCount} phòng từ OCCUPIED về AVAILABLE:`, res1.rows.map(row => row.room_number));

    // 2. Chuyển AVAILABLE sang OCCUPIED nếu số hợp đồng hoạt động >= sức chứa
    const res2 = await pool.query(`
      UPDATE rooms r
      SET status = 'OCCUPIED', updated_at = now()
      WHERE r.status = 'AVAILABLE'
        AND (SELECT COUNT(*) FROM contracts c WHERE c.room_id = r.id AND c.status = 'ACTIVE') >= r.capacity
      RETURNING r.room_number
    `);
    console.log(`Đã chuyển ${res2.rowCount} phòng từ AVAILABLE sang OCCUPIED:`, res2.rows.map(row => row.room_number));

  } catch (err) {
    console.error("Lỗi:", err.message);
  } finally {
    await pool.end();
  }
}
main();
