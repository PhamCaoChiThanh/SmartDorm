const bcrypt = require('bcryptjs');
const db = require('./src/utils/db');

async function createAdmin() {
  const username = 'admin';
  const password = '123456';
  const role = 'ADMIN';

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const check = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    
    if (check.rows.length > 0) {
      console.log('Tài khoản admin đã tồn tại. Đang cập nhật mật khẩu...');
      await db.query('UPDATE users SET password_hash = $1, role = $2 WHERE username = $3', [passwordHash, role, username]);
      console.log('Đã cập nhật mật khẩu cho tài khoản admin.');
    } else {
      console.log('Đang tạo tài khoản admin mới...');
      await db.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        [username, passwordHash, role]
      );
      console.log('Tạo tài khoản admin thành công!');
    }
  } catch (error) {
    console.error('Lỗi khi tạo admin:', error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
