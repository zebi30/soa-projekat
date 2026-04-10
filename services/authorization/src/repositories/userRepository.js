const db = require("../config/db");

async function createUser({ username, email, passwordHash, role }) {
  const result = await db.query(
    `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, password_hash, role, is_blocked, created_at, updated_at
    `,
    [username, email, passwordHash, role]
  );

  return result.rows[0];
}

async function findByEmail(email) {
  const result = await db.query(
    `
      SELECT id, username, email, password_hash, role, is_blocked, created_at, updated_at
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findByUsername(username) {
  const result = await db.query(
    `
      SELECT id, username, email, password_hash, role, is_blocked, created_at, updated_at
      FROM users
      WHERE username = $1
    `,
    [username]
  );

  return result.rows[0] || null;
}

async function listAllSafeUsers() {
  const result = await db.query(
    `
      SELECT id, username, email, role, is_blocked, created_at, updated_at
      FROM users
      ORDER BY id ASC
    `
  );

  return result.rows;
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  listAllSafeUsers
};
