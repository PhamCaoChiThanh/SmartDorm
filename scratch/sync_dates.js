const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: 'localhost',
  database: 'smartdorm',
  user: 'postgres',
  password: 'Chithanh123@',
  port: 5432,
});

async function run() {
  try {
    // 1. Sync payment_date from payments table to invoices table
    const syncPaymentsQuery = `
      UPDATE invoices i
      SET payment_date = p.payment_date
      FROM payments p
      WHERE i.id = p.invoice_id AND i.payment_date IS NULL;
    `;
    const resPayments = await pool.query(syncPaymentsQuery);
    console.log('Synced payment dates from payments table:', resPayments.rowCount);

    // 2. If status is PAID but payment_date is still null, set to updated_at
    const resPaidFallback = await pool.query(`
      UPDATE invoices
      SET payment_date = updated_at
      WHERE status = 'PAID' AND payment_date IS NULL;
    `);
    console.log('Updated PAID invoices with null payment_date to updated_at:', resPaidFallback.rowCount);

    // 3. For sent_at, set to updated_at / created_at for testing/existing invoices
    const resSent = await pool.query(`
      UPDATE invoices
      SET sent_at = created_at
      WHERE sent_at IS NULL;
    `);
    console.log('Set sent_at to created_at for existing invoices:', resSent.rowCount);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
