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
    console.log('Đang kết nối tới RDS để thêm cột sent_at và payment_date vào bảng invoices...');
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;`);
    await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;`);
    console.log('Thêm cột thành công!');
  } catch (error) {
    console.error('Lỗi khi thêm cột:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
