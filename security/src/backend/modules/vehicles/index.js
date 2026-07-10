const { Client } = require('pg');

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  const clientConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1' ? false : { rejectUnauthorized: false }
  };

  const client = new Client(clientConfig);
  await client.connect();
  
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    // Basic Routing
    if (path.startsWith('/vehicles')) {
      if (method === 'GET') {
        const tenantId = event.queryStringParameters?.tenant_id;
        let query = 'SELECT * FROM vehicles';
        let params = [];
        
        if (tenantId) {
          query += ' WHERE tenant_id = $1';
          params.push(tenantId);
        }
        
        const res = await client.query(query, params);
        return response(200, res.rows);
      }
      
      if (method === 'POST') {
        const { tenant_id, license_plate, vehicle_model, type } = JSON.parse(event.body);
        const query = `
          INSERT INTO vehicles (tenant_id, license_plate, vehicle_model, type)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const res = await client.query(query, [tenant_id, license_plate, vehicle_model, type]);
        return response(201, res.rows[0]);
      }
    }

    if (path.startsWith('/parking/registrations')) {
      if (method === 'GET') {
        const res = await client.query('SELECT * FROM parking_registrations');
        return response(200, res.rows);
      }
      
      if (method === 'POST') {
        const { vehicle_id, tenant_id, ticket_type, start_date, fee_per_period } = JSON.parse(event.body);
        const query = `
          INSERT INTO parking_registrations (vehicle_id, tenant_id, ticket_type, start_date, fee_per_period, status)
          VALUES ($1, $2, $3, $4, $5, 'PENDING')
          RETURNING *
        `;
        const res = await client.query(query, [vehicle_id, tenant_id, ticket_type, start_date, fee_per_period]);
        return response(201, res.rows[0]);
      }
    }

    return response(404, { message: 'Not Found' });
  } catch (err) {
    console.error('Error:', err);
    return response(500, { message: 'Internal Server Error', error: err.message });
  } finally {
    await client.end();
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
