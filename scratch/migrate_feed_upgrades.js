const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '123456',
  database: 'smart_dorm',
  port: 5432
});

const ddl = `
-- 1. Add image_url to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Add parent_id and likes_count to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;

-- 3. Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
`;

async function run() {
  try {
    console.log("Upgrading database for Feed features (image, replies, comment likes)...");
    await pool.query(ddl);
    console.log("Database upgraded successfully!");
  } catch (error) {
    console.error("Database upgrade failed:", error);
  } finally {
    await pool.end();
  }
}

run();
