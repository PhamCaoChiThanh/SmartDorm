const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '123456',
  database: 'smart_dorm',
  port: 5432
});

async function run() {
  try {
    console.log("Adding avatar_url column to users table...");
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
    `);
    console.log("Column avatar_url added successfully.");

    // Select all users to see what seeds we should add
    const res = await pool.query("SELECT id, username, role FROM users");
    console.log(`Found ${res.rows.length} users. Seeding avatars...`);

    for (const row of res.rows) {
      // Generate a nice avatar URL using Dicebear
      let avatarUrl = "";
      if (row.role === 'ADMIN') {
        avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${row.username}`;
      } else if (row.role === 'MANAGER') {
        avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.username}`;
      } else {
        avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${row.username}`;
      }

      await pool.query(
        "UPDATE users SET avatar_url = $1 WHERE id = $2",
        [avatarUrl, row.id]
      );
      console.log(`Updated avatar for user ${row.username} (${row.role}) to: ${avatarUrl}`);
    }

    console.log("Avatar migration and seeding completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

run();
