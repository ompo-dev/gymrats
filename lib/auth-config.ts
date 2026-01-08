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

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: false, // Desabilitado: apenas Google OAuth
  },
  // Habilitar linking automático de contas baseado em email
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"], // Google é confiável para linking por email
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  basePath: "/api/auth",
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  // Configurar mapeamento de campos para Session
  session: {
    fields: {
      token: "token", // Better Auth usa 'token'
      expiresAt: "expiresAt", // Better Auth usa 'expiresAt'
    },
  },
  // Hooks para garantir que novos usuários tenham student profile
  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => {
          // Mapear token -> sessionToken (legacy) e expiresAt -> expires (legacy)
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
          // Garantir que campos legacy sejam populados
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
          // Usar type assertion para acessar campos legacy que existem no banco mas não no tipo
          const accountWithLegacy = account as any;

          console.log("[Account Hook Before] Dados recebidos:", {
            accountId: account.accountId,
            providerId: account.providerId,
            provider: accountWithLegacy.provider,
            providerAccountId: accountWithLegacy.providerAccountId,
          });

          // Se Better Auth está criando com campos novos, popular campos legacy
          const updatedData: any = { ...account };

          // Mapear accountId -> providerAccountId
          if (account.accountId && !accountWithLegacy.providerAccountId) {
            updatedData.providerAccountId = account.accountId;
          }
          // Mapear providerId -> provider
          if (account.providerId && !accountWithLegacy.provider) {
            updatedData.provider = account.providerId;
          }
          // Mapear accessToken -> access_token
          if (account.accessToken && !accountWithLegacy.access_token) {
            updatedData.access_token = account.accessToken;
          }
          // Mapear refreshToken -> refresh_token
          if (account.refreshToken && !accountWithLegacy.refresh_token) {
            updatedData.refresh_token = account.refreshToken;
          }
          // Mapear idToken -> id_token
          if (account.idToken && !accountWithLegacy.id_token) {
            updatedData.id_token = account.idToken;
          }
          // Converter accessTokenExpiresAt (DateTime) -> expires_at (Int)
          if (account.accessTokenExpiresAt && !accountWithLegacy.expires_at) {
            updatedData.expires_at = Math.floor(
              new Date(account.accessTokenExpiresAt).getTime() / 1000
            );
          }
          // Garantir que type seja definido se não estiver
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
          // Usar type assertion para acessar campos legacy que existem no banco mas não no tipo
          const accountWithLegacy = account as any;

          console.log("[Account Hook After] Conta criada:", {
            id: account.id,
            accountId: account.accountId,
            providerId: account.providerId,
            provider: accountWithLegacy.provider,
            providerAccountId: accountWithLegacy.providerAccountId,
          });

          // Garantir que campos legacy sejam populados se não foram no before
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

          // Garantir que provider e providerAccountId estejam sempre definidos
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
          // Quando um novo usuário é criado via Google OAuth
          // Garantir que tenha student profile se for role STUDENT
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
              // Não lançar erro para não interromper o fluxo de autenticação
            }
          }

          // Se for GYM ou ADMIN, garantir que tenha gym profile
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

                // Criar perfil da gym
                await db.gymProfile.create({
                  data: {
                    gymId: newGym.id,
                  },
                });

                // Criar stats da gym
                await db.gymStats.create({
                  data: {
                    gymId: newGym.id,
                  },
                });

                // Atualizar activeGymId
                await db.user.update({
                  where: { id: user.id },
                  data: { activeGymId: newGym.id },
                });
              }
            } catch (error) {
              console.error("Erro ao criar gym profile:", error);
              // Não lançar erro para não interromper o fluxo de autenticação
            }
          }
        },
      },
    },
  },
  // Hook para sincronizar cookie auth_token após login social
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Detectar quando uma sessão é criada via OAuth callback ou sign-in social
      const isOAuthCallback = ctx.path?.startsWith("/callback/");
      const isSocialSignIn = ctx.path === "/sign-in/social";

      if (isOAuthCallback || isSocialSignIn) {
        // newSession tem estrutura { session: { token: string }, user: {...} }
        const sessionToken = (ctx.context.newSession as any)?.session?.token;

        if (sessionToken) {
          // Definir cookie auth_token para compatibilidade
          ctx.setCookie("auth_token", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 dias
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
