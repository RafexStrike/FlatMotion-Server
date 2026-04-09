import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { bearer } from "better-auth/plugins";

const trustedOrigins = process.env.TRUSTED_CLIENT_ORIGIN?.split(",") || [];

if (trustedOrigins.length === 0) {
  throw new Error("TRUSTED_CLIENT_ORIGIN is not set");
}

const authUrls = process.env.BETTER_AUTH_URL?.split(",").map(u => u.trim()) || [];

if (authUrls.length === 0) {
  throw new Error("BETTER_AUTH_URL is not set or invalid");
}

// If there's a production URL (non-localhost), use it. Otherwise use first URL.
// This allows using both localhost and production URLs in the same env var
const baseURL =
  authUrls.find(url => !url.includes("localhost")) || authUrls[0];

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
        secure: true, // Must be true for sameSite: none
        sameSite: "none", // Allow cross-site OAuth redirects from Google
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
  // Redirect successful OAuth back to frontend dashboard
  redirects: {
    afterSignIn: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : undefined,
    afterSignUp: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : undefined,
  },
});
