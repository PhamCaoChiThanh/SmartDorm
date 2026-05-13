const express = require('express');
const roomHandler = require('./handlers/roomHandler');
const tenantHandler = require('./handlers/tenantHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.get('/api/rooms', roomHandler.getAllRooms);
app.get('/api/rooms/:id', roomHandler.getRoomById);

// Tenant Routes
app.get('/api/tenants', tenantHandler.getAllTenants);
app.post('/api/tenants', tenantHandler.createTenant);

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Test API at: http://localhost:${PORT}/api/rooms`);
});
