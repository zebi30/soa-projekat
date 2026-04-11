INSERT INTO users (username, email, password_hash, role, is_blocked)
VALUES ($1, $2, $3, 'admin', FALSE)
ON CONFLICT (email) DO UPDATE
SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  is_blocked = FALSE,
  updated_at = CURRENT_TIMESTAMP;
