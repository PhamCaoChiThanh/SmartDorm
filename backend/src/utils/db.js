const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình kết nối PostgreSQL (RDS)
const host = process.env.DB_HOST || 'localhost';
const pool = new Pool({
  host,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'smart_dorm',
  port: process.env.DB_PORT || 5432,
  ssl: host !== 'localhost' && host !== '127.0.0.1' ? { rejectUnauthorized: false } : false
});

// Hàm query dùng chung
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  query,
  pool
};
