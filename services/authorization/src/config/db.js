const { Pool } = require("pg");

const env = require("./env");

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD
});

module.exports = {
  pool,
  query(text, params) {
    return pool.query(text, params);
  }
};
