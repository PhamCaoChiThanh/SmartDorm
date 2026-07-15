const { Pool } = require('pg');
require('dotenv').config();

const run = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'smartdorm', // Kết nối thẳng tới database smartdorm
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`Đang kết nối tới RDS để thêm cột avatar_url...`);
    const query = `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`;
    await pool.query(query);
    console.log('Thêm cột avatar_url thành công!');
  } catch (error) {
    console.error('Lỗi khi thêm cột avatar_url:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
