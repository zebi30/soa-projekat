const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/db");

async function start() {
  try {
    await connectDatabase();
    app.listen(env.PORT, () => {
      console.log(`Tours service is running on port ${env.PORT}.`);
    });
  } catch (error) {
    console.error("Failed to start tours service:", error);
    process.exit(1);
  }
}

start();
