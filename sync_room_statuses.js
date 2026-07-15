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
    console.log('Đang kết nối tới RDS để đồng bộ trạng thái phòng...');
    
    // 1. Chuyển các phòng bị đánh dấu OCCUPIED nhưng chưa đủ người về AVAILABLE
    const query1 = `
      UPDATE rooms r
      SET status = 'AVAILABLE'
      WHERE status = 'OCCUPIED'
        AND (SELECT COUNT(*) FROM contracts c WHERE c.room_id = r.id AND c.status = 'ACTIVE') < r.capacity;
    `;
    const res1 = await pool.query(query1);
    console.log(`Số phòng được chuyển từ OCCUPIED -> AVAILABLE: ${res1.rowCount}`);

    // 2. Chuyển các phòng AVAILABLE nhưng đã đủ người sang OCCUPIED
    const query2 = `
      UPDATE rooms r
      SET status = 'OCCUPIED'
      WHERE status = 'AVAILABLE'
        AND (SELECT COUNT(*) FROM contracts c WHERE c.room_id = r.id AND c.status = 'ACTIVE') >= r.capacity;
    `;
    const res2 = await pool.query(query2);
    console.log(`Số phòng được chuyển từ AVAILABLE -> OCCUPIED: ${res2.rowCount}`);

  } catch (error) {
    console.error('Lỗi khi đồng bộ:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
