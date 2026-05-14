const db = require('../utils/db');

/**
 * Lấy danh sách tất cả hợp đồng
 */
const getAllContracts = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, t.full_name as tenant_name, r.room_number 
      FROM contracts c
      JOIN tenants t ON c.tenant_id = t.id
      JOIN rooms r ON c.room_id = r.id
      ORDER BY c.created_at DESC
    `);
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hợp đồng',
      error: error.message
    });
  }
};

/**
 * Tạo hợp đồng mới và cập nhật trạng thái phòng
 */
const createContract = async (req, res) => {
  const { tenant_id, room_id, start_date, end_date } = req.body;

  try {
    // Sử dụng Transaction để đảm bảo tính nhất quán
    await db.query('BEGIN');

    // 1. Tạo hợp đồng
    const contractResult = await db.query(
      'INSERT INTO contracts (tenant_id, room_id, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tenant_id, room_id, start_date, end_date, 'ACTIVE']
    );

    // 2. Cập nhật trạng thái phòng thành OCCUPIED
    await db.query(
      "UPDATE rooms SET status = 'OCCUPIED' WHERE id = $1",
      [room_id]
    );

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Tạo hợp đồng thành công và đã cập nhật trạng thái phòng',
      data: contractResult.rows[0]
    });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo hợp đồng',
      error: error.message
    });
  }
};

/**
 * Kết thúc hợp đồng sớm và giải phóng phòng
 */
const terminateContract = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    // 1. Cập nhật trạng thái hợp đồng thành TERMINATED
    const contractResult = await db.query(
      "UPDATE contracts SET status = 'TERMINATED', updated_at = now() WHERE id = $1 RETURNING room_id",
      [id]
    );

    if (contractResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
    }

    const roomId = contractResult.rows[0].room_id;

    // 2. Cập nhật lại trạng thái phòng thành AVAILABLE
    await db.query(
      "UPDATE rooms SET status = 'AVAILABLE' WHERE id = $1",
      [roomId]
    );

    await db.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Đã kết thúc hợp đồng và giải phóng phòng thành công'
    });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kết thúc hợp đồng',
      error: error.message
    });
  }
};

module.exports = {
  getAllContracts,
  createContract,
  terminateContract
};
