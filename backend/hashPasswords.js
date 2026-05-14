const db = require('./src/utils/db');
const bcrypt = require('bcryptjs');

async function hashAllPasswords() {
  try {
    const result = await db.query('SELECT id, username, password_hash FROM users');
    const users = result.rows;
    let updatedCount = 0;

    for (const user of users) {
      // bcrypt hashes usually start with $2a$, $2b$, or $2y$
      if (!user.password_hash.startsWith('$2')) {
        console.log(`Đang mã hóa mật khẩu cho user: ${user.username}...`);
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(user.password_hash, salt);
        
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
        updatedCount++;
      }
    }
    console.log(`Đã hoàn tất. Cập nhật mã hóa mật khẩu cho ${updatedCount} tài khoản.`);
  } catch (error) {
    console.error('Lỗi khi mã hóa:', error);
  } finally {
    process.exit(0);
  }
}

hashAllPasswords();
