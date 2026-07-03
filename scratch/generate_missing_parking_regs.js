const db = require('../src/utils/db');

async function repair() {
  try {
    console.log('Đang quét các xe thiếu đăng ký gửi xe (parking registration)...');
    
    // Lấy các xe chưa có bản ghi parking_registrations tương ứng
    const res = await db.query(`
      SELECT v.id AS vehicle_id, v.tenant_id, v.type
      FROM vehicles v
      LEFT JOIN parking_registrations pr ON pr.vehicle_id = v.id
      WHERE pr.id IS NULL;
    `);

    const missingVehicles = res.rows;
    console.log(`Tìm thấy ${missingVehicles.length} xe thiếu đăng ký gửi xe.`);

    for (const v of missingVehicles) {
      let fee = 150000;
      if (v.type === 'BICYCLE') fee = 50000;
      else if (v.type === 'CAR') fee = 500000;

      console.log(`Đang sinh đăng ký gửi xe cho xe: ${v.vehicle_id} (Phí tháng: ${fee}đ)...`);
      
      // 1. Tạo Parking Registration với trạng thái APPROVED
      const regRes = await db.query(`
        INSERT INTO parking_registrations (vehicle_id, tenant_id, ticket_type, start_date, fee_per_period, status, created_at, updated_at)
        VALUES ($1, $2, 'MONTHLY', NOW(), $3, 'APPROVED', NOW(), NOW())
        RETURNING id;
      `, [v.vehicle_id, v.tenant_id, fee]);

      const regId = regRes.rows[0].id;

      // 2. Đồng thời sinh hóa đơn gửi xe cho tháng 7 năm 2026 để hiển thị cùng hóa đơn phòng
      await db.query(`
        INSERT INTO parking_invoices (registration_id, billing_month, billing_year, amount, status, created_at, updated_at)
        VALUES ($1, 7, 2026, $2, 'PENDING', NOW(), NOW());
      `, [regId, fee]);

      console.log(`Đã tạo hóa đơn gửi xe tháng 7/2026 cho đăng ký gửi xe: ${regId}`);
    }

    console.log('Đã cập nhật toàn bộ thông tin gửi xe và hóa đơn gửi xe thành công!');
  } catch (err) {
    console.error('Lỗi khi chạy lệnh sửa đổi:', err.message);
  } finally {
    process.exit(0);
  }
}

repair();
