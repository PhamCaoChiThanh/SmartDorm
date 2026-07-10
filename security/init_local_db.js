const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables if .env exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function run() {
  try {
    // 1. Đọc file appsettings.json để lấy thông tin kết nối
    const appsettingsPath = path.join(__dirname, '..', 'backend', 'appsettings.json');
    if (!fs.existsSync(appsettingsPath)) {
      throw new Error(`Không tìm thấy file appsettings.json tại: ${appsettingsPath}`);
    }
    const appsettings = JSON.parse(fs.readFileSync(appsettingsPath, 'utf8'));
    const connStr = appsettings.ConnectionStrings?.DefaultConnection;
    
    if (!connStr) {
      throw new Error('Không tìm thấy DefaultConnection trong appsettings.json');
    }

    // Parse Connection String
    const config = {};
    connStr.split(';').forEach(pair => {
      const idx = pair.indexOf('=');
      if (idx !== -1) {
        const key = pair.substring(0, idx).trim().toLowerCase();
        const val = pair.substring(idx + 1).trim();
        config[key] = val;
      }
    });

    const host = config.host || 'localhost';
    const port = parseInt(config.port || '5432');
    const databaseName = config.database || 'smartdorm';
    const username = config.username || 'postgres';
    
    // List passwords to try
    const passwordsToTry = [];
    if (config.password) {
      passwordsToTry.push(config.password);
    }
    if (process.env.DB_PASSWORD && !passwordsToTry.includes(process.env.DB_PASSWORD)) {
      passwordsToTry.push(process.env.DB_PASSWORD);
    }
    // standard defaults
    if (!passwordsToTry.includes('123456')) passwordsToTry.push('123456');
    if (!passwordsToTry.includes('postgres')) passwordsToTry.push('postgres');
    if (!passwordsToTry.includes('admin')) passwordsToTry.push('admin');

    console.log('--- Đang kiểm tra kết nối tới PostgreSQL local ---');
    console.log(`Host: ${host}`);
    console.log(`User: ${username}`);
    
    let workingPassword = null;
    let adminClient = null;

    // Thử kết nối tới database mặc định 'postgres' bằng các mật khẩu
    for (const pwd of passwordsToTry) {
      try {
        const tempClient = new Client({
          host,
          port,
          database: 'postgres',
          user: username,
          password: pwd,
        });
        await tempClient.connect();
        adminClient = tempClient;
        workingPassword = pwd;
        break;
      } catch (e) {
        // Tiếp tục thử mật khẩu tiếp theo
      }
    }

    if (!adminClient) {
      console.error('❌ Không thể kết nối tới PostgreSQL bằng các mật khẩu đã thử.');
      console.error('Vui lòng kiểm tra lại mật khẩu PostgreSQL của bạn.');
      console.error('Mật khẩu đã thử:', passwordsToTry.map(p => '*'.repeat(p.length)).join(', '));
      return;
    }

    console.log(`✅ Kết nối thành công tới database 'postgres' (sử dụng mật khẩu phù hợp).`);

    // Kiểm tra xem database 'smartdorm' đã tồn tại chưa
    const checkDbRes = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`--- Đang tạo database '${databaseName}'... ---`);
      await adminClient.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`✅ Đã tạo database '${databaseName}' thành công!`);
    } else {
      console.log(`ℹ️ Database '${databaseName}' đã tồn tại.`);
    }
    await adminClient.end();

    // 2. Kết nối trực tiếp vào database 'smartdorm' để chạy file database.sql
    console.log(`--- Đang nạp schema cho database '${databaseName}'... ---`);
    const client = new Client({
      host,
      port,
      database: databaseName,
      user: username,
      password: workingPassword,
    });

    await client.connect();

    // Đọc file database.sql
    const sqlPath = path.join(__dirname, '..', 'database.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Không tìm thấy file database.sql tại: ${sqlPath}`);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('--- Đang thực thi database.sql... ---');
    await client.query(sql);
    console.log('🚀 KHỞI TẠO CƠ SỞ DỮ LIỆU LOCAL THÀNH CÔNG!');
    
    // Nếu mật khẩu dùng được khác với mật khẩu trong appsettings.json, gợi ý người dùng cập nhật
    if (workingPassword !== config.password) {
      console.log(`\n💡 Gợi ý: Hãy cập nhật mật khẩu trong file 'backend/appsettings.json' thành '${workingPassword}' để Backend có thể kết nối được.`);
    }

    await client.end();
  } catch (err) {
    console.error('❌ LỖI:', err.message);
  }
}

run();
