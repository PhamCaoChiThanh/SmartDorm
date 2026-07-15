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
    console.log('Đang kết nối tới RDS để thêm cột was_renewed vào bảng contracts...');
    const query = `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS was_renewed BOOLEAN DEFAULT FALSE;`;
    await pool.query(query);
    console.log('Thêm cột was_renewed thành công!');
  } catch (error) {
    console.error('Lỗi khi thêm cột was_renewed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
