const { Pool } = require('pg');
require('dotenv').config({ path: 'm:/SmartDorm/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Chithanh123@',
  database: process.env.DB_NAME || 'smartdorm',
  port: process.env.DB_PORT || 5432,
});

async function main() {
  try {
    // 1. Perform Login Request
    const loginRes = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "nguyenvana", password: "123456@Abc" })
    });

    const loginData = await loginRes.json();
    if (!loginData.token) {
      console.error("Login failed.");
      return;
    }

    // 2. Clear existing test vehicles for nguyenvana first
    await pool.query("DELETE FROM vehicles WHERE license_plate = '59X1-55555'");

    // 3. Register a vehicle
    console.log("Registering vehicle...");
    const regRes = await fetch("http://localhost:3001/api/vehicles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        licensePlate: "59X1-55555",
        type: "Xe máy"
      })
    });
    console.log("Register Status:", regRes.status);
    const regData = await regRes.json();
    console.log("Register Response:", regData);

    // 4. Fetch list
    console.log("\nCalling GET /api/vehicles...");
    const vehiclesRes = await fetch("http://localhost:3001/api/vehicles", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${loginData.token}`
      }
    });
    console.log("Vehicles Status:", vehiclesRes.status);
    const data = await vehiclesRes.json();
    console.log("Vehicles Data:", data);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
