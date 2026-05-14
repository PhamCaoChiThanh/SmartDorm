const db = require('../utils/db');

/**
 * Lấy danh sách xe
 */
const getAllVehicles = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, t.full_name as owner_name 
      FROM vehicles v
      LEFT JOIN tenants t ON v.tenant_id = t.id
      ORDER BY v.created_at DESC
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách xe', error: error.message });
  }
};

/**
 * Đăng ký xe mới cho người thuê
 */
const registerVehicle = async (req, res) => {
  const { tenant_id, license_plate, vehicle_model, type } = req.body;

  if (!['BICYCLE', 'MOTORBIKE', 'CAR'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Loại xe không hợp lệ (BICYCLE, MOTORBIKE, CAR).' });
  }

  try {
    // Kiểm tra biển số trùng lặp
    const existCheck = await db.query('SELECT id FROM vehicles WHERE license_plate = $1', [license_plate]);
    if (existCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Biển số xe này đã được đăng ký trên hệ thống.' });
    }

    const result = await db.query(
      'INSERT INTO vehicles (tenant_id, license_plate, vehicle_model, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenant_id, license_plate, vehicle_model, type]
    );

    res.status(201).json({ success: true, message: 'Đăng ký xe thành công', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi đăng ký xe', error: error.message });
  }
};

/**
 * Xóa xe
 */
const removeVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe để xóa.' });
    }
    res.status(200).json({ success: true, message: 'Xóa xe thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa xe', error: error.message });
  }
};

module.exports = {
  getAllVehicles,
  registerVehicle,
  removeVehicle
};
