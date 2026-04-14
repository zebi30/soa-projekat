const db = require("../config/db");

async function createUser({ username, email, passwordHash, role }) {
  const result = await db.query(
    `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, password_hash, role, is_blocked, first_name, last_name, profile_image_url, biography, motto, created_at, updated_at
    `,
    [username, email, passwordHash, role]
  );

  return result.rows[0];
}

async function findByEmail(email) {
  const result = await db.query(
    `
      SELECT id, username, email, password_hash, role, is_blocked, first_name, last_name, profile_image_url, biography, motto, created_at, updated_at
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
      SELECT id, username, email, password_hash, role, is_blocked, first_name, last_name, profile_image_url, biography, motto, created_at, updated_at
      FROM users
      WHERE username = $1
    `,
    [username]
  );

  return result.rows[0] || null;
}

async function findById(id) {
  const result = await db.query(
    `
      SELECT id, username, email, role, is_blocked, first_name, last_name, profile_image_url, biography, motto, created_at, updated_at
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function blockUserById(id) {
  const result = await db.query(
    `
      UPDATE users
      SET is_blocked = TRUE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, role, is_blocked, first_name, last_name, profile_image_url, biography, motto, created_at, updated_at
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function updateUserById(id, fields) {
  const allowed = ["first_name", "last_name", "profile_image_url", "biography", "motto"];
  const setClauses = [];
  const values = [];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      values.push(fields[key]);
      setClauses.push(`${key} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  values.push(id);
  const result = await db.query(
    `
      UPDATE users
      SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING id, username, email, role, is_blocked, first_name, last_name, profile_image_url, biography, motto, created_at, updated_at
    `,
    values
  );

  return result.rows[0] || null;
}

async function listAllSafeUsers() {
  const result = await db.query(
    `
      SELECT id, username, email, role, is_blocked, first_name, last_name, profile_image_url, biography, motto, created_at, updated_at
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
  findById,
  blockUserById,
  updateUserById,
  listAllSafeUsers
};
