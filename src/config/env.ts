// File: src/config/env.ts

import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || "development",
  trustedClientOrigin: process.env.TRUSTED_CLIENT_ORIGIN,

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // AI Provider API keys
  geminiApiKey: process.env.GEMINI_API_KEY,
  hfApiKey: process.env.HF_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};

export default config;
