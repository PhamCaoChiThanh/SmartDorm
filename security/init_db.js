const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
    // Bước 1: Kết nối tới database mặc định 'postgres' để tạo database 'smartdorm'
    const adminClient = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'postgres', // Kết nối tới db mặc định
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Đang kết nối tới AWS RDS (quyền Admin)... ---');
        await adminClient.connect();

        // Kiểm tra xem db smartdorm đã tồn tại chưa
        const checkRes = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'smartdorm'");
        if (checkRes.rowCount === 0) {
            console.log("--- Đang tạo database 'smartdorm'... ---");
            await adminClient.query('CREATE DATABASE smartdorm');
            console.log("✅ Đã tạo database 'smartdorm' thành công!");
        } else {
            console.log("ℹ️ Database 'smartdorm' đã tồn tại sẵn.");
        }
        await adminClient.end();

        // Bước 2: Kết nối tới database 'smartdorm' để nạp Schema
        const client = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        console.log("✅ Đã kết nối tới database 'smartdorm'!");

        const sqlPath = path.join(__dirname, '..', 'database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('--- Đang nạp Schema (database.sql)... ---');
        await client.query(sql);
        console.log('🚀 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC KHỞI TẠO THÀNH CÔNG!');
        await client.end();

    } catch (err) {
        console.error('❌ LỖI RỒI:', err.message);
        process.exit(1);
    }
}

initializeDatabase();
