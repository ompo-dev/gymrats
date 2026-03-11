import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins/bearer";
import { oneTimeToken } from "better-auth/plugins/one-time-token";
import { db } from "@gymrats/db";

type AuthInstance = ReturnType<typeof betterAuth>;

let authInstance: AuthInstance | null = null;

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getApiUrl() {
  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_API_URL || getAppUrl();
}

function getTrustedOrigins() {
  const extraTrustedOrigins = (process.env.TRUSTED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set([getAppUrl(), getApiUrl(), ...extraTrustedOrigins]));
}

function assertRequiredEnv() {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is not configured in the environment");
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in the environment");
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_SECRET is not configured in the environment");
  }
}

function createAuth() {
  assertRequiredEnv();

  return betterAuth({
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
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },
    plugins: [
      bearer(),
      oneTimeToken({
        expiresIn: 3,
      }),
    ],
    baseURL: getApiUrl(),
    basePath: "/api/auth",
    trustedOrigins: getTrustedOrigins(),
    session: {
      fields: {
        token: "token",
        expiresAt: "expiresAt",
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session, _ctx) => {
            const updatedData = {
              ...session,
            } as Record<string, string | number | boolean | object | null>;

            if (session.token && !session.sessionToken) {
              updatedData.sessionToken = session.token;
            }
            if (session.expiresAt && !session.expires) {
              updatedData.expires = session.expiresAt;
            }

            return { data: updatedData };
          },
          after: async (session, _ctx) => {
            const updateData: Record<
              string,
              string | number | boolean | object | null
            > = {};

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
          before: async (account, _ctx) => {
            const accountWithLegacy = account as typeof account & {
              provider?: string;
              providerAccountId?: string;
              access_token?: string;
              refresh_token?: string;
              id_token?: string;
              expires_at?: number;
            };

            console.log("[Account Hook Before] Data received:", {
              accountId: account.accountId,
              providerId: account.providerId,
              provider: accountWithLegacy.provider,
              providerAccountId: accountWithLegacy.providerAccountId,
            });

            const updatedData: Record<
              string,
              string | number | boolean | object | null
            > = { ...account };

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
                new Date(account.accessTokenExpiresAt).getTime() / 1000,
              );
            }
            if (!updatedData.type) {
              updatedData.type = "oauth";
            }

            console.log("[Account Hook Before] Data transformed:", {
              provider: updatedData.provider,
              providerAccountId: updatedData.providerAccountId,
              type: updatedData.type,
            });

            return { data: updatedData };
          },
          after: async (account, _ctx) => {
            const accountWithLegacy = account as typeof account & {
              provider?: string;
              providerAccountId?: string;
              access_token?: string;
              refresh_token?: string;
              id_token?: string;
              expires_at?: number;
            };

            console.log("[Account Hook After] Account created:", {
              id: account.id,
              accountId: account.accountId,
              providerId: account.providerId,
              provider: accountWithLegacy.provider,
              providerAccountId: accountWithLegacy.providerAccountId,
            });

            const updateData: Record<
              string,
              string | number | boolean | object | null
            > = {};

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
                accountWithLegacy.expires_at * 1000,
              );
            }

            if (!updateData.provider && account.providerId) {
              updateData.provider = account.providerId;
            }
            if (!updateData.providerAccountId && account.accountId) {
              updateData.providerAccountId = account.accountId;
            }

            if (Object.keys(updateData).length > 0) {
              console.log("[Account Hook After] Updating account with:", updateData);
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
          after: async (user, _ctx) => {
            if (user.role === "PENDING") {
              return;
            }

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
                console.error("Error creating student profile:", error);
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
                console.error("Error creating gym profile:", error);
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
          const sessionToken = (
            ctx.context.newSession as { session?: { token?: string } }
          )?.session?.token;

          if (sessionToken) {
            ctx.setCookie("auth_token", sessionToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
              path: "/",
            });

            console.log("[Auth Hook] auth_token cookie synced after social login");
          }
        }
      }),
    },
  });
}

function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop) {
    const instance = getAuth();
    const value = Reflect.get(instance, prop, instance);

    return typeof value === "function" ? value.bind(instance) : value;
  },
  set(_target, prop, value) {
    const instance = getAuth();

    return Reflect.set(instance, prop, value, instance);
  },
}) as AuthInstance;

export type Session = AuthInstance["$Infer"]["Session"];
