const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

/**
 * Đăng ký người dùng mới
 */
const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // 1. Kiểm tra username/email đã tồn tại chưa
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username hoặc Email đã tồn tại.' });
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Lưu vào database
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, passwordHash, role || 'TENANT']
    );

    res.status(201).json({
      message: 'Đăng ký thành công.',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
  }
};

/**
 * Đăng nhập
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Tìm user
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    // 2. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    // 3. Tạo JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
  }
};

module.exports = {
  register,
  login
};