const db = require('../src/utils/db');

async function check() {
  try {
    const res = await db.query(`
      SELECT pr.*, t.full_name, v.license_plate
      FROM parking_registrations pr
      JOIN tenants t ON pr.tenant_id = t.id
      JOIN vehicles v ON pr.vehicle_id = v.id;
    `);
    console.log('Các đăng ký gửi xe trong DB:', res.rows);

    const invoices = await db.query(`
      SELECT pi.*, v.license_plate, t.full_name
      FROM parking_invoices pi
      JOIN parking_registrations pr ON pi.registration_id = pr.id
      JOIN tenants t ON pr.tenant_id = t.id
      JOIN vehicles v ON pr.vehicle_id = v.id;
    `);
    console.log('Các hóa đơn gửi xe trong DB:', invoices.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
