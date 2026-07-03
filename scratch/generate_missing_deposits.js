const db = require('../src/utils/db');

async function repair() {
  try {
    console.log('Đang quét các hợp đồng thiếu thông tin đặt cọc...');
    
    // Lấy các hợp đồng chưa có bản ghi deposits tương ứng
    const res = await db.query(`
      SELECT c.id AS contract_id, c.room_id, r.base_price 
      FROM contracts c
      JOIN rooms r ON c.room_id = r.id
      LEFT JOIN deposits d ON d.contract_id = c.id
      WHERE d.id IS NULL AND c.status = 'ACTIVE';
    `);

    const missingContracts = res.rows;
    console.log(`Tìm thấy ${missingContracts.length} hợp đồng thiếu tiền đặt cọc.`);

    for (const item of missingContracts) {
      console.log(`Đang sinh tiền cọc cho hợp đồng: ${item.contract_id} (Phòng giá: ${item.base_price}đ)...`);
      
      // 1. Tạo Deposit
      const depositRes = await db.query(`
        INSERT INTO deposits (contract_id, total_amount, remaining_balance, status, created_at, updated_at)
        VALUES ($1, $2, $2, 'HOLDING', NOW(), NOW())
        RETURNING id;
      `, [item.contract_id, item.base_price]);

      const depositId = depositRes.rows[0].id;

      // 2. Tạo DepositTransaction
      await db.query(`
        INSERT INTO deposit_transactions (deposit_id, amount, transaction_type, reason, created_at)
        VALUES ($1, $2, 'RECEIVE', 'Thu tiền đặt cọc (Bổ sung dữ liệu hệ thống)', NOW());
      `, [depositId, item.base_price]);
    }

    console.log('Đã cập nhật tiền đặt cọc thành công cho toàn bộ hợp đồng hiện tại!');
  } catch (err) {
    console.error('Lỗi khi chạy lệnh sửa đổi:', err.message);
  } finally {
    process.exit(0);
  }
}

repair();
