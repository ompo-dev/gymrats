import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "./db";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET não está configurado no .env");
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error(
    "GOOGLE_CLIENT_ID não está configurado no .env. " +
      "Configure suas credenciais do Google OAuth no arquivo .env"
  );
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "GOOGLE_CLIENT_SECRET não está configurado no .env. " +
      "Configure suas credenciais do Google OAuth no arquivo .env"
  );
}

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const authUrl =
  process.env.BETTER_AUTH_URL || "http://localhost:3001";
const isProd = process.env.NODE_ENV === "production";
const isCrossSite = (() => {
  try {
    return new URL(appUrl).origin !== new URL(authUrl).origin;
  } catch {
    return false;
  }
})();
const cookieSameSite = isCrossSite ? "none" : "lax";
const cookieSecure = isCrossSite ? true : isProd;
console.log("[Auth] Cookie defaults:", {
  sameSite: cookieSameSite,
  secure: cookieSecure,
  isCrossSite,
  isProd,
});

export const auth = betterAuth({
  advanced: {
    defaultCookieAttributes: {
      sameSite: cookieSameSite,
      secure: cookieSecure,
    },
  },
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: false,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
    // Apenas em dev para não bloquear o fluxo local
    skipStateCookieCheck: !isProd,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  baseURL: authUrl,
  basePath: "/api/auth",
  trustedOrigins: [appUrl, authUrl],
  session: {
    fields: {
      token: "token",
      expiresAt: "expiresAt",
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => {
          const updatedData: any = { ...session };

          if (session.token && !session.sessionToken) {
            updatedData.sessionToken = session.token;
          }
          if (session.expiresAt && !session.expires) {
            updatedData.expires = session.expiresAt;
          }

          return { data: updatedData };
        },
        after: async (session, ctx) => {
          const updateData: any = {};

          if (session.token && !session.sessionToken) {
            updateData.sessionToken = session.token;
          }
          if (session.expiresAt && !session.expires) {
            updateData.expires = session.expiresAt;
          }

          if (Object.keys(updateData).length > 0) {
            await db.session.update({
              where: { id: session.id },
              data: updateData,
            });
          }
        },
      },
    },
    account: {
      create: {
        before: async (account, ctx) => {
          const accountWithLegacy = account as any;

          console.log("[Account Hook Before] Dados recebidos:", {
            accountId: account.accountId,
            providerId: account.providerId,
            provider: accountWithLegacy.provider,
            providerAccountId: accountWithLegacy.providerAccountId,
          });

          const updatedData: any = { ...account };

          if (account.accountId && !accountWithLegacy.providerAccountId) {
            updatedData.providerAccountId = account.accountId;
          }
          if (account.providerId && !accountWithLegacy.provider) {
            updatedData.provider = account.providerId;
          }
          if (account.accessToken && !accountWithLegacy.access_token) {
            updatedData.access_token = account.accessToken;
          }
          if (account.refreshToken && !accountWithLegacy.refresh_token) {
            updatedData.refresh_token = account.refreshToken;
          }
          if (account.idToken && !accountWithLegacy.id_token) {
            updatedData.id_token = account.idToken;
          }
          if (account.accessTokenExpiresAt && !accountWithLegacy.expires_at) {
            updatedData.expires_at = Math.floor(
              new Date(account.accessTokenExpiresAt).getTime() / 1000
            );
          }
          if (!updatedData.type) {
            updatedData.type = "oauth";
          }

          console.log("[Account Hook Before] Dados transformados:", {
            provider: updatedData.provider,
            providerAccountId: updatedData.providerAccountId,
            type: updatedData.type,
          });

          return { data: updatedData };
        },
        after: async (account, ctx) => {
          const accountWithLegacy = account as any;

          console.log("[Account Hook After] Conta criada:", {
            id: account.id,
            accountId: account.accountId,
            providerId: account.providerId,
            provider: accountWithLegacy.provider,
            providerAccountId: accountWithLegacy.providerAccountId,
          });

          const updateData: any = {};

          if (account.accountId && !accountWithLegacy.providerAccountId) {
            updateData.providerAccountId = account.accountId;
          }
          if (account.providerId && !accountWithLegacy.provider) {
            updateData.provider = account.providerId;
          }
          if (accountWithLegacy.providerAccountId && !account.accountId) {
            updateData.accountId = accountWithLegacy.providerAccountId;
          }
          if (accountWithLegacy.provider && !account.providerId) {
            updateData.providerId = accountWithLegacy.provider;
          }
          if (accountWithLegacy.access_token && !account.accessToken) {
            updateData.accessToken = accountWithLegacy.access_token;
          }
          if (accountWithLegacy.refresh_token && !account.refreshToken) {
            updateData.refreshToken = accountWithLegacy.refresh_token;
          }
          if (accountWithLegacy.id_token && !account.idToken) {
            updateData.idToken = accountWithLegacy.id_token;
          }
          if (accountWithLegacy.expires_at && !account.accessTokenExpiresAt) {
            updateData.accessTokenExpiresAt = new Date(
              accountWithLegacy.expires_at * 1000
            );
          }

          if (!updateData.provider && account.providerId) {
            updateData.provider = account.providerId;
          }
          if (!updateData.providerAccountId && account.accountId) {
            updateData.providerAccountId = account.accountId;
          }

          if (Object.keys(updateData).length > 0) {
            console.log(
              "[Account Hook After] Atualizando conta com:",
              updateData
            );
            await db.account.update({
              where: { id: account.id },
              data: updateData,
            });
          }
        },
      },
    },
    user: {
      create: {
        after: async (user, ctx) => {
          if (user.role === "STUDENT" || user.role === "ADMIN") {
            try {
              const existingStudent = await db.student.findUnique({
                where: { userId: user.id },
              });

              if (!existingStudent) {
                await db.student.create({
                  data: {
                    userId: user.id,
                  },
                });
              }
            } catch (error) {
              console.error("Erro ao criar student profile:", error);
            }
          }

          if (user.role === "GYM" || user.role === "ADMIN") {
            try {
              const existingGyms = await db.gym.findMany({
                where: { userId: user.id },
              });

              if (existingGyms.length === 0) {
                const newGym = await db.gym.create({
                  data: {
                    userId: user.id,
                    name: user.name,
                    address: "",
                    phone: "",
                    email: user.email,
                    plan: "basic",
                    isActive: true,
                  },
                });

                await db.gymProfile.create({
                  data: {
                    gymId: newGym.id,
                  },
                });

                await db.gymStats.create({
                  data: {
                    gymId: newGym.id,
                  },
                });

                await db.user.update({
                  where: { id: user.id },
                  data: { activeGymId: newGym.id },
                });
              }
            } catch (error) {
              console.error("Erro ao criar gym profile:", error);
            }
          }
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const isOAuthCallback = ctx.path?.startsWith("/callback/");
      const isSocialSignIn = ctx.path === "/sign-in/social";

      if (isOAuthCallback || isSocialSignIn) {
        const sessionToken = (ctx.context.newSession as any)?.session?.token;

        if (sessionToken) {
          ctx.setCookie("auth_token", sessionToken, {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: cookieSameSite,
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          });

          console.log(
            "[Auth Hook] Cookie auth_token sincronizado após login social"
          );
        }
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
