const db = require('../utils/db');

/**
 * Lấy danh sách tất cả sinh viên
 */
const getAllTenants = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sinh viên',
      error: error.message
    });
  }
};

/**
 * Thêm mới sinh viên (Đồng thời tạo User tương ứng)
 */
const createTenant = async (req, res) => {
  const { full_name, cccd, phone, email, username, password } = req.body;

  try {
    // Bắt đầu một Transaction để đảm bảo tạo cả User và Tenant thành công
    await db.query('BEGIN');

    // 1. Tạo User trước (Mặc định role là TENANT)
    const userResult = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, password, 'TENANT'] // Ở thực tế cần hash password, tạm thời để thô để test
    );
    
    const userId = userResult.rows[0].id;

    // 2. Tạo Tenant liên kết với User vừa tạo
    const tenantResult = await db.query(
      'INSERT INTO tenants (user_id, full_name, cccd, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, full_name, cccd, phone, email]
    );

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Thêm sinh viên thành công',
      data: tenantResult.rows[0]
    });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm sinh viên',
      error: error.message
    });
  }
};

module.exports = {
  getAllTenants,
  createTenant
};
