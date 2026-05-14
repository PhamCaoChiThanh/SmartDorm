const db = require('../utils/db');

/**
 * Lấy danh sách tất cả các phòng
 */
const getAllRooms = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM rooms ORDER BY room_number ASC');
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết một phòng theo ID
 */
const getRoomById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
    }
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin phòng',
      error: error.message
    });
  }
};

/**
 * Thêm mới một phòng
 */
const createRoom = async (req, res) => {
  const { room_number, capacity, base_price, garbage_fee, electricity_price, water_price } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO rooms (room_number, capacity, base_price, garbage_fee, electricity_price, water_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [room_number, capacity, base_price, garbage_fee || 0, electricity_price, water_price]
    );
    res.status(201).json({
      success: true,
      message: 'Thêm phòng thành công',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm phòng',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin phòng
 */
const updateRoom = async (req, res) => {
  const { id } = req.params;
  const { room_number, capacity, status, base_price, garbage_fee, electricity_price, water_price } = req.body;
  try {
    const result = await db.query(
      `UPDATE rooms 
       SET room_number = $1, capacity = $2, status = $3, base_price = $4, garbage_fee = $5, electricity_price = $6, water_price = $7, updated_at = now()
       WHERE id = $8 RETURNING *`,
      [room_number, capacity, status, base_price, garbage_fee, electricity_price, water_price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để cập nhật' });
    }
    res.status(200).json({
      success: true,
      message: 'Cập nhật phòng thành công',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phòng',
      error: error.message
    });
  }
};

/**
 * Xóa phòng
 */
const deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để xóa' });
    }
    res.status(200).json({
      success: true,
      message: 'Xóa phòng thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phòng (Lưu ý: Không thể xóa phòng đã có hợp đồng)',
      error: error.message
    });
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
