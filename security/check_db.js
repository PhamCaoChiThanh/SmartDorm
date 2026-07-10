const { Client } = require('pg');
require('dotenv').config();

async function checkDatabase() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('--- Đang kiểm tra cấu trúc Database trên AWS... ---');

        // Lấy danh sách các bảng trong schema 'public'
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        if (res.rows.length > 0) {
            console.log('✅ Đã tìm thấy các bảng sau:');
            res.rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.table_name}`);
            });
            console.log('\n🚀 Mọi thứ đã sẵn sàng!');
        } else {
            console.log('❌ Database trống (không tìm thấy bảng nào).');
        }

    } catch (err) {
        console.error('❌ Lỗi kết nối:', err.message);
    } finally {
        await client.end();
    }
}

checkDatabase();
