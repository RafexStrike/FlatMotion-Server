import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { bearer, oAuthProxy } from "better-auth/plugins";

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

const primaryClientOrigin =
  trustedOrigins.find(url => !url.includes("localhost")) || trustedOrigins[0];

// Determine correct SameSite value based on environment
const isSameSiteNone = baseURL.startsWith("https");

console.log(`[Auth Config] baseURL: ${baseURL}`);
console.log(`[Auth Config] primaryClientOrigin: ${primaryClientOrigin}`);
console.log(`[Auth Config] isSameSiteNone: ${isSameSiteNone}`);
console.log(`[Auth Config] Cookie Secure: ${isSameSiteNone}`);
console.log(`[Auth Config] Cookie SameSite: ${isSameSiteNone ? "none" : "lax"}`);
console.log(`[Auth Config] trustedOrigins: ${trustedOrigins.join(", ")}`);

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
  appName: "FlatMotion",
  onAPIError: {
    errorURL: `${primaryClientOrigin}/login`,
  },

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    },
  },

  trustedOrigins,
  advanced: {
    useSecureCookies: isSameSiteNone,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isSameSiteNone,
      sameSite: isSameSiteNone ? "none" : "lax",
      path: "/",
    },
    storeStateStrategy: "cookie",
  },
  plugins: [
    oAuthProxy({
      currentURL: primaryClientOrigin,
      productionURL: baseURL,
      maxAge: 300,
    }),
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
