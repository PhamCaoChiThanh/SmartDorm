const db = require('../utils/db');

/**
 * Lấy danh sách toàn bộ hóa đơn
 */
const getAllInvoices = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, c.room_id, r.room_number
      FROM invoices i
      JOIN contracts c ON i.contract_id = c.id
      JOIN rooms r ON c.room_id = r.id
      ORDER BY i.billing_year DESC, i.billing_month DESC, r.room_number ASC
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách hóa đơn', error: error.message });
  }
};

/**
 * Tạo hóa đơn tháng cho một hợp đồng
 */
const generateMonthlyInvoice = async (req, res) => {
  const { contract_id, billing_month, billing_year } = req.body;

  try {
    // 1. Kiểm tra hóa đơn đã tồn tại chưa
    const existCheck = await db.query(
      'SELECT id FROM invoices WHERE contract_id = $1 AND billing_month = $2 AND billing_year = $3',
      [contract_id, billing_month, billing_year]
    );
    if (existCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Hóa đơn cho tháng này đã được tạo.' });
    }

    // 2. Lấy thông tin phòng từ contract
    const contractResult = await db.query(`
      SELECT c.*, r.base_price, r.electricity_price, r.water_price, r.id as room_id
      FROM contracts c
      JOIN rooms r ON c.room_id = r.id
      WHERE c.id = $1
    `, [contract_id]);

    if (contractResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });
    }
    const contract = contractResult.rows[0];

    // 3. Lấy chỉ số điện nước tháng này
    const utilityResult = await db.query(`
      SELECT * FROM utility_usages 
      WHERE room_id = $1 AND billing_month = $2 AND billing_year = $3
    `, [contract.room_id, billing_month, billing_year]);

    let electricUsage = 0;
    let waterUsage = 0;

    utilityResult.rows.forEach(u => {
      const usage = u.new_index - u.old_index;
      if (u.type === 'ELECTRIC') electricUsage = usage;
      if (u.type === 'WATER') waterUsage = usage;
    });

    // 4. Tính toán
    const roomFee = Number(contract.base_price);
    const electricFee = electricUsage * Number(contract.electricity_price);
    const waterFee = waterUsage * Number(contract.water_price);
    const totalAmount = roomFee + electricFee + waterFee;

    // 5. Lưu hóa đơn
    const invoiceResult = await db.query(`
      INSERT INTO invoices (contract_id, billing_month, billing_year, room_fee, electric_fee, water_fee, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
      RETURNING *
    `, [contract_id, billing_month, billing_year, roomFee, electricFee, waterFee, totalAmount]);

    res.status(201).json({ success: true, message: 'Tạo hóa đơn thành công', data: invoiceResult.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tạo hóa đơn', error: error.message });
  }
};

/**
 * Thanh toán hóa đơn
 */
const payInvoice = async (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body;

  try {
    // Cập nhật trạng thái hóa đơn
    const invoiceResult = await db.query(`
      UPDATE invoices SET status = 'PAID', updated_at = now() 
      WHERE id = $1 AND status != 'PAID'
      RETURNING *
    `, [id]);

    if (invoiceResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Hóa đơn không tồn tại hoặc đã được thanh toán.' });
    }

    const invoice = invoiceResult.rows[0];

    // Tạo record thanh toán
    await db.query(`
      INSERT INTO payments (invoice_id, amount, payment_method)
      VALUES ($1, $2, $3)
    `, [id, invoice.total_amount, payment_method || 'CASH']);

    res.status(200).json({ success: true, message: 'Thanh toán thành công', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi thanh toán', error: error.message });
  }
};

module.exports = {
  getAllInvoices,
  generateMonthlyInvoice,
  payInvoice
};
