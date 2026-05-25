const db = require('./src/utils/db');

async function seed() {
  const rooms = [];

  // Tạo 50 phòng mẫu
  const areas = ['A', 'B', 'C', 'D'];
  const statuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];

  for (let i = 1; i <= 50; i++) {
    const area = areas[Math.floor(Math.random() * areas.length)];
    const roomNumber = `${area}${i}`;
    const capacity = [1, 2, 4][Math.floor(Math.random() * 3)];
    
    // Status phân bổ: 70% AVAILABLE, 20% OCCUPIED, 10% MAINTENANCE
    const rand = Math.random();
    const status = rand < 0.7 ? 'AVAILABLE' : (rand < 0.9 ? 'OCCUPIED' : 'MAINTENANCE');
    
    // Giá dựa trên capacity
    let basePrice = 1500000;
    if (capacity === 1) basePrice = 2200000;
    else if (capacity === 2) basePrice = 1800000;
    else if (capacity === 4) basePrice = 1400000;

    rooms.push({
      room_number: roomNumber,
      capacity,
      status,
      base_price: basePrice,
      electricity: 3500,
      water: 15000
    });
  }

  try {
    console.log('Đang kết nối database và xóa các phòng cũ...');
    await db.query('TRUNCATE TABLE rooms CASCADE;');

    console.log('Đang thêm 50 phòng mẫu vào database...');
    for (const r of rooms) {
      await db.query(`
        INSERT INTO rooms (room_number, capacity, status, base_price, garbage_fee, electricity_price, water_price)
        VALUES ($1, $2, $3, $4, 50000, $5, $6);
      `, [r.room_number, r.capacity, r.status, r.base_price, r.electricity, r.water]);
    }

    console.log('Đã thêm thành công 50 phòng vào database PostgreSQL!');
  } catch (err) {
    console.error('Lỗi khi seed 50 phòng:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();
