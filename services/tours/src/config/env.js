const dotenv = require("dotenv");

dotenv.config();

const requiredVariables = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET"
];

const missingVariables = requiredVariables.filter((key) => !process.env[key]);

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`);
}

module.exports = {
  PORT: Number(process.env.PORT),
  GRPC_PORT: Number(process.env.GRPC_PORT || 9093),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET
};
