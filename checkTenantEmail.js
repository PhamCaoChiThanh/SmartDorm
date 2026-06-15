const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: 'localhost',
  database: 'smartdorm',
  user: 'postgres',
  password: 'Chithanh123@',
  port: 5432,
});

async function checkTenantEmail() {
  try {
    const query = `
      SELECT t.id, t.full_name, t.email, t.cccd, r.room_number, c.id as contract_id
      FROM tenants t
      LEFT JOIN contracts c ON t.id = c.tenant_id
      LEFT JOIN rooms r ON c.room_id = r.id
      WHERE c.status = 'ACTIVE'
    `;
    
    const result = await pool.query(query);
    
    console.log('=== DANH SÁCH TENANT CÓ HỢP ĐỒNG ACTIVE ===');
    console.log('Tổng số:', result.rows.length);
    console.log('');
    
    result.rows.forEach(row => {
      console.log('Tên:', row.full_name);
      console.log('CCCD:', row.cccd);
      console.log('Email:', row.email || '❌ KHÔNG CÓ EMAIL');
      console.log('Phòng:', row.room_number || 'N/A');
      console.log('Contract ID:', row.contract_id);
      console.log('---');
    });
    
    const noEmail = result.rows.filter(r => !r.email);
    if (noEmail.length > 0) {
      console.log(`\n⚠️ CÓ ${noEmail.length} TENANT KHÔNG CÓ EMAIL - KHÔNG THỂ GỬI BILL!`);
    } else {
      console.log('\n✅ Tất cả tenant đều có email.');
    }
    
  } catch (err) {
    console.error('Lỗi:', err.message);
  } finally {
    await pool.end();
  }
}

checkTenantEmail();
