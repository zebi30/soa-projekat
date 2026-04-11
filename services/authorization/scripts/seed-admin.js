const fs = require("fs");
const path = require("path");

const { pool } = require("../src/config/db");
const env = require("../src/config/env");
const { hashPassword } = require("../src/utils/hash");

async function main() {
  const seedPath = path.join(__dirname, "..", "src", "sql", "seed-admin.sql");
  const seedSql = fs.readFileSync(seedPath, "utf8");
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  await pool.query(seedSql, [
    env.ADMIN_USERNAME,
    env.ADMIN_EMAIL,
    passwordHash
  ]);
  await pool.end();

  console.log("Admin account seeded.");
}

main().catch(async (error) => {
  console.error("Failed to seed admin account.", error);

  try {
    await pool.end();
  } catch (poolError) {
    console.error("Failed to close database pool.", poolError);
  }

  process.exit(1);
});
