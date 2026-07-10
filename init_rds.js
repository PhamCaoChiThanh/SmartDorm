const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const run = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres', // Tạm thời dùng DB mặc định của postgres để tạo
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } // Bắt buộc khi kết nối RDS từ bên ngoài
  });

  try {
    console.log(`Đang kết nối tới RDS: ${process.env.DB_HOST}...`);
    
    // Đọc file database.sql
    const sqlPath = path.join(__dirname, 'database.sql');
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

    console.log('Đang thực thi các lệnh SQL tạo bảng...');
    await pool.query(sqlQuery);
    console.log('Khởi tạo Database thành công trên Amazon RDS!');
  } catch (error) {
    console.error('Lỗi khi khởi tạo Database:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
