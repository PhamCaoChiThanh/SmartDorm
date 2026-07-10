const db = require('../utils/db');

/**
 * Lấy danh sách chỉ số điện/nước
 */
const getAllUsages = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT uu.*, r.room_number 
      FROM utility_usages uu
      JOIN rooms r ON uu.room_id = r.id
      ORDER BY uu.billing_year DESC, uu.billing_month DESC, r.room_number ASC
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu điện nước', error: error.message });
  }
};

/**
 * Ghi nhận chỉ số điện/nước mới cho một phòng
 */
const recordUsage = async (req, res) => {
  const { room_id, type, billing_month, billing_year, old_index, new_index } = req.body;
  
  if (!['WATER', 'ELECTRIC'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Loại tiện ích không hợp lệ. Phải là WATER hoặc ELECTRIC.' });
  }

  if (new_index < old_index) {
    return res.status(400).json({ success: false, message: 'Chỉ số mới không được nhỏ hơn chỉ số cũ.' });
  }

  try {
    // Kiểm tra xem phòng có tồn tại không
    const roomCheck = await db.query('SELECT id FROM rooms WHERE id = $1', [room_id]);
    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng.' });
    }

    // Kiểm tra xem tháng này đã ghi nhận chưa
    const existCheck = await db.query(
      'SELECT id FROM utility_usages WHERE room_id = $1 AND type = $2 AND billing_month = $3 AND billing_year = $4',
      [room_id, type, billing_month, billing_year]
    );

    if (existCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: `Chỉ số ${type} cho tháng ${billing_month}/${billing_year} của phòng này đã được ghi nhận.` });
    }

    const result = await db.query(
      'INSERT INTO utility_usages (room_id, type, billing_month, billing_year, old_index, new_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [room_id, type, billing_month, billing_year, old_index, new_index]
    );

    res.status(201).json({ success: true, message: 'Ghi nhận chỉ số thành công', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi ghi nhận chỉ số điện nước', error: error.message });
  }
};

module.exports = {
  getAllUsages,
  recordUsage
};
