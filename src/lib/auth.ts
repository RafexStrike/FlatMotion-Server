import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { bearer } from "better-auth/plugins";

const trustedOrigins = process.env.TRUSTED_CLIENT_ORIGIN?.split(",") || [];

if (trustedOrigins.length === 0) {
  throw new Error("TRUSTED_CLIENT_ORIGIN is not set");
}

const baseURL = process.env.BETTER_AUTH_URL?.split(",")[0].trim() || "";

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not set or invalid");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
      }
    }
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  basePath: "/api/auth",

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  trustedOrigins,
  cookies: {
    sessionToken: {
      attributes: {
        httpOnly: true,
        secure: true,       // REQUIRED for cross-site
        sameSite: "none",   // REQUIRED for cross-site
      },
    },
  },
  plugins: [
    bearer(),
  ],
  onSessionCreated: async (session: any) => {
    console.log("[Better-Auth Hook] Session Created:", {
      id: session.session.id,
      userId: session.session.userId,
      expiresAt: session.session.expiresAt
    });
  },
  onSessionDeleted: async (session: any) => {
    console.log("[Better-Auth Hook] Session Deleted:", session.session?.id || session.id);
  },
});
