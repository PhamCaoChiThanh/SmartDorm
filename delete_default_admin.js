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
    console.log('Đang kết nối tới RDS để xóa tài khoản admin mặc định (admin/123456)...');
    const query = `DELETE FROM users WHERE username = 'admin';`;
    const res = await pool.query(query);
    console.log(`Đã xóa tài khoản admin mặc định. Số dòng ảnh hưởng: ${res.rowCount}`);
  } catch (error) {
    console.error('Lỗi khi xóa admin mặc định:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
