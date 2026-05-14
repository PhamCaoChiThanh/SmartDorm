const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const roomHandler = require('./handlers/roomHandler');
const tenantHandler = require('./handlers/tenantHandler');
const authHandler = require('./handlers/authHandler');
const contractHandler = require('./handlers/contractHandler');
const utilityHandler = require('./handlers/utilityHandler');
const vehicleHandler = require('./handlers/vehicleHandler');
const invoiceHandler = require('./handlers/invoiceHandler');
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

// Quản lý điện nước
app.get('/api/utilities', verifyToken, authorize(['ADMIN', 'MANAGER']), utilityHandler.getAllUsages);
app.post('/api/utilities', verifyToken, authorize(['ADMIN', 'MANAGER']), utilityHandler.recordUsage);

// Quản lý xe cộ
app.get('/api/vehicles', verifyToken, authorize(['ADMIN', 'MANAGER']), vehicleHandler.getAllVehicles);
app.post('/api/vehicles', verifyToken, authorize(['ADMIN', 'MANAGER']), vehicleHandler.registerVehicle);
app.delete('/api/vehicles/:id', verifyToken, authorize(['ADMIN', 'MANAGER']), vehicleHandler.removeVehicle);

// Quản lý hóa đơn
app.get('/api/invoices', verifyToken, authorize(['ADMIN', 'MANAGER', 'TENANT']), invoiceHandler.getAllInvoices);
app.post('/api/invoices/generate', verifyToken, authorize(['ADMIN', 'MANAGER']), invoiceHandler.generateMonthlyInvoice);
app.post('/api/invoices/:id/pay', verifyToken, authorize(['ADMIN', 'MANAGER']), invoiceHandler.payInvoice);

// Kiểm tra trạng thái server
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Xuất handler cho AWS Lambda
module.exports.handler = serverless(app);
