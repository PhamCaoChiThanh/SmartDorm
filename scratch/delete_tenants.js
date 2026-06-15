const { Pool } = require('pg');
require('dotenv').config({ path: 'm:/SmartDorm/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Chithanh123@',
  database: process.env.DB_NAME || 'smartdorm',
  port: process.env.DB_PORT || 5432,
});

async function deleteTenantCascade(client, tenantId, fullName) {
  console.log(`\n--- Cascading deletion for tenant: ${fullName} (${tenantId}) ---`);

  // 1. Get user_id and occupied room ids
  const tenantRes = await client.query('SELECT user_id FROM tenants WHERE id = $1', [tenantId]);
  if (tenantRes.rows.length === 0) {
    console.log(`Tenant ${fullName} not found.`);
    return;
  }
  const userId = tenantRes.rows[0].user_id;

  const roomsRes = await client.query('SELECT DISTINCT room_id FROM contracts WHERE tenant_id = $1', [tenantId]);
  const roomIds = roomsRes.rows.map(r => r.room_id).filter(id => id != null);

  // 2. Delete parking records
  const pkPaymentsDel = await client.query(`
    DELETE FROM parking_payments 
    WHERE parking_invoice_id IN (
      SELECT pi.id FROM parking_invoices pi
      JOIN parking_registrations pr ON pi.registration_id = pr.id
      WHERE pr.tenant_id = $1
    )
  `, [tenantId]);
  console.log(`Deleted parking payments: ${pkPaymentsDel.rowCount}`);

  const pkInvoicesDel = await client.query(`
    DELETE FROM parking_invoices 
    WHERE registration_id IN (
      SELECT id FROM parking_registrations WHERE tenant_id = $1
    )
  `, [tenantId]);
  console.log(`Deleted parking invoices: ${pkInvoicesDel.rowCount}`);

  const pkRegsDel = await client.query(`
    DELETE FROM parking_registrations WHERE tenant_id = $1
  `, [tenantId]);
  console.log(`Deleted parking registrations: ${pkRegsDel.rowCount}`);

  // 3. Delete vehicles
  const vehiclesDel = await client.query('DELETE FROM vehicles WHERE tenant_id = $1', [tenantId]);
  console.log(`Deleted vehicles: ${vehiclesDel.rowCount}`);

  // 4. Delete room requests
  const requestsDel = await client.query('DELETE FROM room_requests WHERE tenant_id = $1', [tenantId]);
  console.log(`Deleted room requests: ${requestsDel.rowCount}`);

  // 5. Delete maintenances
  const maintsDel = await client.query('DELETE FROM maintenances WHERE reported_by = $1', [tenantId]);
  console.log(`Deleted maintenance reports: ${maintsDel.rowCount}`);

  // 6. Delete deposits and transactions
  const depTxDel = await client.query(`
    DELETE FROM deposit_transactions 
    WHERE deposit_id IN (
      SELECT d.id FROM deposits d
      JOIN contracts c ON d.contract_id = c.id
      WHERE c.tenant_id = $1
    )
  `, [tenantId]);
  console.log(`Deleted deposit transactions: ${depTxDel.rowCount}`);

  const depositsDel = await client.query(`
    DELETE FROM deposits 
    WHERE contract_id IN (
      SELECT id FROM contracts WHERE tenant_id = $1
    )
  `, [tenantId]);
  console.log(`Deleted deposits: ${depositsDel.rowCount}`);

  // 7. Delete payments and invoices
  const paymentsDel = await client.query(`
    DELETE FROM payments 
    WHERE invoice_id IN (
      SELECT i.id FROM invoices i
      JOIN contracts c ON i.contract_id = c.id
      WHERE c.tenant_id = $1
    )
  `, [tenantId]);
  console.log(`Deleted payments: ${paymentsDel.rowCount}`);

  const invoicesDel = await client.query(`
    DELETE FROM invoices 
    WHERE contract_id IN (
      SELECT id FROM contracts WHERE tenant_id = $1
    )
  `, [tenantId]);
  console.log(`Deleted invoices: ${invoicesDel.rowCount}`);

  // 8. Delete contracts
  const contractsDel = await client.query('DELETE FROM contracts WHERE tenant_id = $1', [tenantId]);
  console.log(`Deleted contracts: ${contractsDel.rowCount}`);

  // 9. Update room statuses to AVAILABLE
  if (roomIds.length > 0) {
    const roomsUpdate = await client.query(`
      UPDATE rooms 
      SET status = 'AVAILABLE', updated_at = NOW() 
      WHERE id = ANY($1)
    `, [roomIds]);
    console.log(`Updated rooms to AVAILABLE: ${roomsUpdate.rowCount}`);
  }

  // 10. Delete audit logs of user
  if (userId) {
    const logsDel = await client.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
    console.log(`Deleted audit logs: ${logsDel.rowCount}`);
  }

  // 11. Delete tenant
  const tenantDel = await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
  console.log(`Deleted tenant: ${tenantDel.rowCount}`);

  // 12. Delete user
  if (userId) {
    const userDel = await client.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log(`Deleted user account: ${userDel.rowCount}`);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find tenants "Nguyễn Văn A" and "Trần Thị B"
    const res = await client.query(`
      SELECT id, full_name 
      FROM tenants 
      WHERE full_name IN ('Nguyễn Văn A', 'Trần Thị B')
    `);

    if (res.rows.length === 0) {
      console.log("No tenants found matching 'Nguyễn Văn A' or 'Trần Thị B'.");
    } else {
      for (const tenant of res.rows) {
        await deleteTenantCascade(client, tenant.id, tenant.full_name);
      }
    }

    await client.query('COMMIT');
    console.log("\nTransaction successfully committed!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error executing transaction, rolled back:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
