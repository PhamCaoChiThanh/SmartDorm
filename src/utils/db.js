const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Tải cấu hình từ file .env nếu có
const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Hàm lấy thông tin kết nối DB (ưu tiên .env, sau đó là appsettings.json)
function getDbConfig() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'smartdorm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Chithanh123@',
  };

  // Nếu không cấu hình trong .env, đọc thêm từ appsettings.json
  if (!process.env.DB_HOST) {
    const appsettingsPath = path.join(__dirname, '..', '..', 'backend', 'appsettings.json');
    if (fs.existsSync(appsettingsPath)) {
      try {
        const appsettings = JSON.parse(fs.readFileSync(appsettingsPath, 'utf8'));
        const connStr = appsettings.ConnectionStrings?.DefaultConnection;
        if (connStr) {
          connStr.split(';').forEach(pair => {
            const idx = pair.indexOf('=');
            if (idx !== -1) {
              const key = pair.substring(0, idx).trim().toLowerCase();
              const val = pair.substring(idx + 1).trim();
              if (key === 'host') config.host = val;
              if (key === 'port') config.port = parseInt(val);
              if (key === 'database') config.database = val;
              if (key === 'username') config.user = val;
              if (key === 'password') config.password = val;
            }
          });
        }
      } catch (err) {
        // Bỏ qua lỗi đọc appsettings
      }
    }
  }

  return config;
}

const dbConfig = getDbConfig();
const isLocal = dbConfig.host === 'localhost' || dbConfig.host === '127.0.0.1';

const poolConfig = {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
};

// Nếu kết nối AWS RDS (không phải localhost)
if (!isLocal) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
