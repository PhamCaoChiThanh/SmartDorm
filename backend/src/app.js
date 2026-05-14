const express = require('express');
const cors = require('cors');
const roomHandler = require('./handlers/roomHandler');
const tenantHandler = require('./handlers/tenantHandler');
const authHandler = require('./handlers/authHandler');
const contractHandler = require('./handlers/contractHandler');
const { verifyToken, authorize } = require('./middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Các Route công khai (Không cần đăng nhập)
app.post('/api/auth/register', authHandler.register);
app.post('/api/auth/login', authHandler.login);

// Quản lý phòng (Cần đăng nhập)
app.get('/api/rooms', verifyToken, roomHandler.getAllRooms);
app.get('/api/rooms/:id', verifyToken, roomHandler.getRoomById);
app.post('/api/rooms', verifyToken, authorize(['ADMIN', 'MANAGER']), roomHandler.createRoom);
app.put('/api/rooms/:id', verifyToken, authorize(['ADMIN', 'MANAGER']), roomHandler.updateRoom);
app.delete('/api/rooms/:id', verifyToken, authorize(['ADMIN', 'MANAGER']), roomHandler.deleteRoom);

// Quản lý hợp đồng
app.get('/api/contracts', verifyToken, authorize(['ADMIN', 'MANAGER']), contractHandler.getAllContracts);
app.post('/api/contracts', verifyToken, authorize(['ADMIN', 'MANAGER']), contractHandler.createContract);
app.put('/api/contracts/:id/terminate', verifyToken, authorize(['ADMIN', 'MANAGER']), contractHandler.terminateContract);

// Quản lý người thuê (Chỉ dành cho ADMIN hoặc MANAGER)
app.get('/api/tenants', verifyToken, authorize(['ADMIN', 'MANAGER']), tenantHandler.getAllTenants);
app.post('/api/tenants', verifyToken, authorize(['ADMIN', 'MANAGER']), tenantHandler.createTenant);

// Kiểm tra trạng thái server
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});
