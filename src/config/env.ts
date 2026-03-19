// File: src/config/env.ts

import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || "development",
  trustedClientOrigin: process.env.TRUSTED_CLIENT_ORIGIN,
};

export default config;
