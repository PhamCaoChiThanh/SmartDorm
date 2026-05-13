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

module.exports = {
  getAllRooms,
  getRoomById
};
