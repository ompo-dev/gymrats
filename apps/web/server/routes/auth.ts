import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { Elysia } from "elysia";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updateRoleSchema,
  verifyResetCodeSchema,
} from "@/lib/api/schemas";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { sendResetPasswordEmail } from "@/lib/services/email.service";
import type { UserSummary } from "@/lib/use-cases/auth";
import {
  forgotPasswordUseCase,
  getSessionUseCase,
  resetPasswordUseCase,
  signInUseCase,
  signOutUseCase,
  signUpUseCase,
  updateRoleUseCase,
  verifyResetCodeUseCase,
} from "@/lib/use-cases/auth";
import { createSession, deleteSession, getSession } from "@/lib/utils/session";
import { deleteCookieHeader, setCookieHeader } from "../utils/cookies";
import { getCookieValue } from "../utils/request";
import { badRequestResponse, internalErrorResponse } from "../utils/response";
import { validateBody } from "../utils/validation";

function toUserSummary(u: {
  id: string;
  email: string;
  name: string;
  role: string;
  password?: string | null;
  createdAt?: Date;
  student?: { id: string } | null;
  gyms?: { id: string }[];
  personal?: { id: string } | null;
}): UserSummary {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserSummary["role"],
    createdAt: u.createdAt,
    student: u.student ?? undefined,
    gyms: u.gyms ?? undefined,
    personal: u.personal ?? undefined,
    password: u.password,
  };
}

export const authRoutes = new Elysia()
  .post("/sign-in", async ({ body, set }) => {
    const validation = validateBody(body as Record<string, unknown>, signInSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    try {
      const result = await signInUseCase(
        {
          findUserByEmail: async (email) => {
            const u = await db.user.findUnique({
              where: { email },
              include: {
                student: { select: { id: true } },
                gyms: { select: { id: true } },
              },
            });
            return u ? toUserSummary(u) : null;
          },
          comparePassword: (plain, hashed) => bcrypt.compare(plain, hashed),
          createSession,
        },
        validation.data,
      );

      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.message };
      }

      setCookieHeader(set, "auth_token", result.data.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return {
        user: result.data.user,
        session: result.data.session,
      };
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return internalErrorResponse(set, "Erro ao fazer login", error);
    }
  })
  .post("/sign-up", async ({ body, set }) => {
    const validation = validateBody(body as Record<string, unknown>, signUpSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    try {
      const result = await signUpUseCase(
        {
          findUserByEmail: async (email) => {
            const u = await db.user.findUnique({ where: { email } });
            return u ? toUserSummary(u) : null;
          },
          hashPassword: (plain) => bcrypt.hash(plain, 10),
          createUser: async (data) => {
            const u = await db.user.create({ data });
            return toUserSummary(u);
          },
          createStudent: (userId) =>
            db.student.create({ data: { userId } }).then(() => undefined),
          createSession,
        },
        validation.data,
      );

      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.message };
      }

      setCookieHeader(set, "auth_token", result.data.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return {
        user: result.data.user,
        session: result.data.session,
      };
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      return internalErrorResponse(set, "Erro ao criar conta", error);
    }
  })
  .get("/session", async ({ request, set }) => {
    try {
      const authHeaderValue = request.headers.get("authorization");
      const authHeaderToken = authHeaderValue
        ? authHeaderValue.replace(/^Bearer\s+/i, "").trim()
        : null;
      const cookieAuthToken = getCookieValue(request.headers, "auth_token");
      const cookieBetterAuthToken = getCookieValue(
        request.headers,
        "better-auth.session_token",
      );

      const result = await getSessionUseCase(
        {
          getBetterAuthSession: async (headers) =>
            auth.api.getSession({ headers }),
          findUserById: async (userId) => {
            const u = await db.user.findUnique({
              where: { id: userId },
              include: {
                student: { select: { id: true } },
                gyms: { select: { id: true } },
              },
            });
            return u ? toUserSummary(u) : null;
          },
          getSessionTokenById: async (sessionId) => {
            const sessionFromDb = await db.session.findUnique({
              where: { id: sessionId },
              select: { token: true },
            });
            return sessionFromDb?.token || null;
          },
          getSessionByToken: async (token) => {
            const session = await getSession(token);
            if (!session) return null;
            return {
              ...session,
              user: toUserSummary(session.user),
            };
          },
        },
        {
          headers: request.headers,
          authHeaderToken,
          cookieAuthToken,
          cookieBetterAuthToken,
        },
      );

      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.message };
      }

      if (result.data.shouldSyncAuthToken && result.data.sessionToken) {
        setCookieHeader(set, "auth_token", result.data.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }

      return {
        user: result.data.user,
        session: result.data.session,
      };
    } catch (error) {
      console.error("Erro ao buscar sessão:", error);
      return internalErrorResponse(set, "Erro ao buscar sessão", error);
    }
  })
  .post("/sign-out", async ({ request, set }) => {
    try {
      const authHeaderValue = request.headers.get("authorization");
      const authHeaderToken = authHeaderValue
        ? authHeaderValue.replace(/^Bearer\s+/i, "").trim()
        : null;
      const cookieAuthToken = getCookieValue(request.headers, "auth_token");
      const cookieBetterAuthToken = getCookieValue(
        request.headers,
        "better-auth.session_token",
      );

      const result = await signOutUseCase(
        {
          signOutBetterAuth: (headers) =>
            auth.api.signOut({ headers }).then(() => undefined),
          deleteSession,
        },
        {
          headers: request.headers,
          authHeaderToken,
          cookieAuthToken,
          cookieBetterAuthToken,
        },
      );

      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.message };
      }

      deleteCookieHeader(set, "auth_token");
      deleteCookieHeader(set, "better-auth.session_token");

      return { success: true };
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      return internalErrorResponse(set, "Erro ao fazer logout", error);
    }
  })
  .post("/update-role", async ({ body, set }) => {
    const validation = validateBody(body as Record<string, unknown>, updateRoleSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    try {
      const result = await updateRoleUseCase(
        {
          findUserById: async (userId) => {
            const u = await db.user.findUnique({
              where: { id: userId },
              include: { student: true, gyms: true, personal: true },
            });
            return u ? toUserSummary(u) : null;
          },
          updateUserRole: async (userId, role) => {
            const u = await db.user.update({ where: { id: userId }, data: { role } });
            return toUserSummary(u);
          },
          findStudentByUserId: (userId) =>
            db.student.findUnique({ where: { userId } }),
          createStudent: (userId) =>
            db.student.create({ data: { userId } }).then(() => undefined),
          findGymByUserId: (userId) => db.gym.findFirst({ where: { userId } }),
          findPersonalByUserId: (userId) =>
            db.personal.findUnique({ where: { userId } }),
          createGym: (data) => db.gym.create({ data }).then(() => undefined),
          createPersonal: (data) =>
            db.personal.create({ data }).then(() => undefined),
        },
        validation.data,
      );

      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.message };
      }

      return result.data;
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      return internalErrorResponse(
        set,
        "Erro ao atualizar tipo de usuário",
        error,
      );
    }
  })
  .post("/forgot-password", async ({ body, set }) => {
    const validation = validateBody(body as Record<string, unknown>, forgotPasswordSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    try {
      const result = await forgotPasswordUseCase(
        {
          findUserByEmail: async (email) => {
            const u = await db.user.findUnique({ where: { email } });
            return u ? toUserSummary(u) : null;
          },
          deleteTokensByIdentifier: (identifier) =>
            db.verificationToken
              .deleteMany({ where: { identifier } })
              .then(() => undefined),
          createVerificationToken: (data) =>
            db.verificationToken.create({ data }).then(() => undefined),
          sendResetPasswordEmail,
          generateResetCode: () => randomInt(100000, 1000000).toString(),
          now: () => new Date(),
        },
        validation.data,
      );

      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.message };
      }

      return result.data;
    } catch (error) {
      console.error(
        "Erro ao processar solicitação de recuperação de senha:",
        error,
      );
      return internalErrorResponse(
        set,
        "Erro ao processar solicitação. Tente novamente.",
        error,
      );
    }
  })
  .post("/verify-reset-code", async ({ body, set }) => {
    const validation = validateBody(body as Record<string, unknown>, verifyResetCodeSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    try {
      const result = await verifyResetCodeUseCase(
        {
          findVerificationToken: (identifier, token) =>
            db.verificationToken.findUnique({
              where: { identifier_token: { identifier, token } },
              select: { expires: true },
            }),
          deleteVerificationToken: (identifier, token) =>
            db.verificationToken
              .delete({
                where: { identifier_token: { identifier, token } },
              })
              .then(() => undefined),
          findUserByEmail: async (email) => {
            const u = await db.user.findUnique({ where: { email } });
            return u ? toUserSummary(u) : null;
          },
          now: () => new Date(),
        },
        validation.data,
      );

      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.message };
      }

      return result.data;
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      return internalErrorResponse(set, "Erro ao verificar código", error);
    }
  })
  .post("/reset-password", async ({ body, set }) => {
    const validation = validateBody(body as Record<string, unknown>, resetPasswordSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    try {
      const result = await resetPasswordUseCase(
        {
          findVerificationToken: (identifier, token) =>
            db.verificationToken.findUnique({
              where: { identifier_token: { identifier, token } },
              select: { expires: true },
            }),
          deleteVerificationToken: (identifier, token) =>
            db.verificationToken
              .delete({
                where: { identifier_token: { identifier, token } },
              })
              .then(() => undefined),
          findUserByEmail: async (email) => {
            const u = await db.user.findUnique({ where: { email } });
            return u ? toUserSummary(u) : null;
          },
          hashPassword: (plain) => bcrypt.hash(plain, 10),
          updateUserPassword: (userId, password) =>
            db.user
              .update({ where: { id: userId }, data: { password } })
              .then(() => undefined),
          now: () => new Date(),
        },
        validation.data,
      );

      if (!result.ok) {
        set.status = result.error.status;
        return { error: result.error.message };
      }

      return result.data;
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      return internalErrorResponse(set, "Erro ao redefinir senha", error);
    }
  });
