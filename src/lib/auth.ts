// File: src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const trustedOrigins = process.env.TRUSTED_CLIENT_ORIGIN?.split(",") || [];

if (trustedOrigins.length === 0) {
  throw new Error("TRUSTED_CLIENT_ORIGIN is not set");
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/auth",

  emailAndPassword: {
    enabled: true,
  },

  emailVerification: {
    enabled: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  trustedOrigins,
});
