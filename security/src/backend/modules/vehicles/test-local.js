const { handler } = require('./index');

// Giả lập Event từ AWS Lambda Function URL
const mockEvent = {
  requestContext: {
    http: {
      method: 'GET',
      path: '/vehicles'
    }
  },
  queryStringParameters: {
    tenant_id: '' // Để trống để lấy tất cả
  }
};

// Cấu hình môi trường giả lập (để kết nối tới DB nếu bạn có DB local hoặc tunnel)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'smartdorm';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'Chithanh123@';

async function runTest() {
  console.log('--- Đang test GET /vehicles ---');
  try {
    const result = await handler(mockEvent);
    console.log('Status:', result.statusCode);
    console.log('Body:', JSON.parse(result.body));
  } catch (err) {
    console.error('Lỗi test:', err);
  }
}

runTest();
