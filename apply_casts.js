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

  const enums = [
    'user_role',
    'room_status',
    'contract_status',
    'invoice_status',
    'request_status',
    'maintenance_status',
    'utility_type',
    'vehicle_type',
    'parking_ticket_type'
  ];

  try {
    console.log('Đang kết nối tới RDS để tạo implicit casts cho các enum...');
    for (const enumName of enums) {
      try {
        console.log(`Đang tạo cast cho ${enumName}...`);
        // Tạo cast từ varchar sang enum
        await pool.query(`CREATE CAST (varchar AS ${enumName}) WITH INOUT AS IMPLICIT;`);
      } catch (err) {
        console.log(`Lưu ý hoặc Lỗi khi tạo cast varchar cho ${enumName}: ${err.message}`);
      }

      try {
        // Tạo cast từ text sang enum
        await pool.query(`CREATE CAST (text AS ${enumName}) WITH INOUT AS IMPLICIT;`);
      } catch (err) {
        console.log(`Lưu ý hoặc Lỗi khi tạo cast text cho ${enumName}: ${err.message}`);
      }
    }
    console.log('Tạo implicit casts hoàn tất!');
  } catch (error) {
    console.error('Lỗi kết nối hoặc thực thi:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

run();
