const fs = require("fs");
const path = require("path");

const { pool } = require("../src/config/db");

async function main() {
  const schemaPath = path.join(__dirname, "..", "src", "sql", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  await pool.query(schemaSql);
  await pool.end();

  console.log("Database schema initialized.");
}

main().catch(async (error) => {
  console.error("Failed to initialize database schema.", error);

  try {
    await pool.end();
  } catch (poolError) {
    console.error("Failed to close database pool.", poolError);
  }

  process.exit(1);
});
