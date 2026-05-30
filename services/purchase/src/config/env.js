const dotenv = require("dotenv");

dotenv.config();

const requiredVariables = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "TOURS_INTERNAL_URL",
  "INTERNAL_API_KEY"
];

const missingVariables = requiredVariables.filter((key) => !process.env[key]);

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`);
}

module.exports = {
  PORT: Number(process.env.PORT),
  GRPC_PORT: Number(process.env.GRPC_PORT || 9094),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  TOURS_INTERNAL_URL: process.env.TOURS_INTERNAL_URL,
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY
};
