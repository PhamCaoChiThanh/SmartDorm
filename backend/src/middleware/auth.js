const jwt = require('jsonwebtoken');

/**
 * Middleware để xác thực Token JWT
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Truy cập bị từ chối. Không có Token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key');
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

/**
 * Middleware để kiểm tra vai trò (Role)
 * @param {Array} roles - Danh sách các quyền được phép (ví dụ: ['ADMIN', 'MANAGER'])
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorize
};
