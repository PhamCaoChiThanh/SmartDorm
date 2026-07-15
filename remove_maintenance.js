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
    console.log('Đang kết nối tới RDS để cập nhật các phòng đang bảo trì thành SẴN SÀNG (AVAILABLE)...');
    const query = `UPDATE rooms SET status = 'AVAILABLE' WHERE status = 'MAINTENANCE';`;
    const res = await pool.query(query);
    console.log(`Đã cập nhật trạng thái phòng. Số phòng được chuyển sang có sẵn: ${res.rowCount}`);
  } catch (error) {
    console.error('Lỗi khi cập nhật phòng:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
