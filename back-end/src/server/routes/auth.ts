import { Elysia } from "elysia";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth-config";
import { createSession, deleteSession, getSession } from "@/lib/utils/session";
import {
  signInSchema,
  signUpSchema,
  updateRoleSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
} from "@gymrats/contracts";
import { sendResetPasswordEmail } from "@/lib/services/email.service";
import {
  badRequestResponse,
  internalErrorResponse,
} from "../utils/response";
import { validateBody } from "../utils/validation";
import { setCookieHeader, deleteCookieHeader } from "../utils/cookies";
import { getCookieValue } from "../utils/request";

export const authRoutes = new Elysia()
  .post("/sign-in/social", async ({ body, request }) => {
    const payload = (body || {}) as Record<string, unknown>;
    const url = new URL(request.url);
    const provider =
      (payload.provider as string | undefined) ||
      url.searchParams.get("provider") ||
      "";

    const appBaseURL =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const apiBaseURL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const authOrigin = url.origin;

    const normalizeUrl = (value?: string | null): string | undefined => {
      if (!value) return undefined;
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
      }
      return `${appBaseURL}${value.startsWith("/") ? "" : "/"}${value}`;
    };

    const forceAppOrigin = (value?: string | null): string | undefined => {
      if (!value) return undefined;
      try {
        const parsed = new URL(value);
        if (parsed.origin === authOrigin || parsed.origin === apiBaseURL) {
          return `${appBaseURL}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        return value;
      }
      return value;
    };

    const callbackURL = normalizeUrl(
      (payload.callbackURL as string | undefined) ||
        url.searchParams.get("callbackURL")
    );
    const errorCallbackURL = normalizeUrl(
      (payload.errorCallbackURL as string | undefined) ||
        url.searchParams.get("errorCallbackURL")
    );
    const newUserCallbackURL = normalizeUrl(
      (payload.newUserCallbackURL as string | undefined) ||
        url.searchParams.get("newUserCallbackURL")
    );

    return auth.api.signInSocial({
      body: {
        ...payload,
        provider,
        ...(callbackURL
          ? { callbackURL: forceAppOrigin(callbackURL) }
          : {}),
        ...(errorCallbackURL
          ? { errorCallbackURL: forceAppOrigin(errorCallbackURL) }
          : {}),
        ...(newUserCallbackURL
          ? { newUserCallbackURL: forceAppOrigin(newUserCallbackURL) }
          : {}),
      },
      headers: request.headers,
    });
  })
  .post("/sign-in", async ({ body, set }) => {
    const validation = validateBody(body, signInSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    try {
      const { email, password } = validation.data;
      const user = await db.user.findUnique({
        where: { email },
        include: {
          student: { select: { id: true } },
          gyms: { select: { id: true } },
        },
      });

      if (!user) {
        set.status = 401;
        return { error: "Email ou senha incorretos" };
      }

      const isValidPassword = user.password
        ? await bcrypt.compare(password, user.password)
        : false;

      if (!isValidPassword) {
        set.status = 401;
        return { error: "Email ou senha incorretos" };
      }

      const sessionToken = await createSession(user.id);
      setCookieHeader(set, "auth_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        session: {
          token: sessionToken,
        },
      };
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return internalErrorResponse(set, "Erro ao fazer login", error);
    }
  })
  .post("/sign-up", async ({ body, set }) => {
    const validation = validateBody(body, signUpSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    try {
      const { name, email, password } = validation.data;
      const existingUser = await db.user.findUnique({ where: { email } });

      if (existingUser) {
        return badRequestResponse(set, "Este email já está cadastrado");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "STUDENT",
        },
      });

      await db.student.create({
        data: {
          userId: newUser.id,
        },
      });

      const sessionToken = await createSession(newUser.id);
      setCookieHeader(set, "auth_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
        session: {
          token: sessionToken,
        },
      };
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      return internalErrorResponse(set, "Erro ao criar conta", error);
    }
  })
  .get("/session", async ({ request, set }) => {
    try {
      try {
        const betterAuthSession = await auth.api.getSession({
          headers: request.headers,
        });

        if (betterAuthSession?.user) {
          const user = await db.user.findUnique({
            where: { id: betterAuthSession.user.id },
            include: {
              student: { select: { id: true } },
              gyms: { select: { id: true } },
            },
          });

          if (user) {
            const isAdmin = user.role === "ADMIN";
            const hasGym = isAdmin || (user.gyms && user.gyms.length > 0);
            const hasStudent = isAdmin || !!user.student;

            const betterAuthToken =
              getCookieValue(request.headers, "better-auth.session_token") ||
              request.headers
                .get("authorization")
                ?.replace("Bearer ", "");

            let sessionToken = betterAuthToken;

            if (!sessionToken && betterAuthSession.session?.id) {
              const sessionFromDb = await db.session.findUnique({
                where: { id: betterAuthSession.session.id },
                select: { token: true },
              });
              sessionToken = sessionFromDb?.token || "";
            }

            if (!sessionToken) {
              sessionToken = betterAuthSession.session?.id || "";
            }

            if (sessionToken) {
              setCookieHeader(set, "auth_token", sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 30,
                path: "/",
              });
            }

            return {
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                hasGym,
                hasStudent,
                createdAt: user.createdAt,
              },
              session: {
                id: betterAuthSession.session?.id || "",
                token: sessionToken,
              },
            };
          }
        }
      } catch (betterAuthError) {
        console.log(
          "[session] Better Auth não encontrou sessão, tentando método antigo"
        );
      }

      let sessionToken =
        getCookieValue(request.headers, "auth_token") ||
        getCookieValue(request.headers, "better-auth.session_token") ||
        request.headers.get("authorization")?.replace("Bearer ", "") ||
        null;

      if (!sessionToken) {
        set.status = 401;
        return { error: "Token não fornecido" };
      }

      sessionToken = sessionToken.trim();
      const session = await getSession(sessionToken);

      if (!session) {
        set.status = 401;
        return { error: "Sessão inválida ou expirada" };
      }

      const isAdmin = session.user.role === "ADMIN";
      const hasGym = isAdmin || (session.user.gyms && session.user.gyms.length > 0);
      const hasStudent = isAdmin || !!session.user.student;

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          hasGym,
          hasStudent,
          createdAt: session.user.createdAt,
        },
        session: {
          id: session.id,
          token: session.token || session.sessionToken || "",
        },
      };
    } catch (error) {
      console.error("Erro ao buscar sessão:", error);
      return internalErrorResponse(set, "Erro ao buscar sessão", error);
    }
  })
  .post("/sign-out", async ({ request, set }) => {
    try {
      try {
        await auth.api.signOut({ headers: request.headers });
        deleteCookieHeader(set, "better-auth.session_token");
        deleteCookieHeader(set, "auth_token");
        return { success: true };
      } catch (betterAuthError) {
        console.log(
          "[sign-out] Better Auth logout falhou, tentando método antigo"
        );
      }

      const sessionToken =
        request.headers.get("authorization")?.replace("Bearer ", "") ||
        getCookieValue(request.headers, "auth_token");

      if (!sessionToken) {
        set.status = 401;
        return { error: "Token não fornecido" };
      }

      await deleteSession(sessionToken);
      deleteCookieHeader(set, "auth_token");
      deleteCookieHeader(set, "better-auth.session_token");

      return { success: true };
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      return internalErrorResponse(set, "Erro ao fazer logout", error);
    }
  })
  .post("/update-role", async ({ body, set }) => {
    const validation = validateBody(body, updateRoleSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    try {
      const { userId, role } = validation.data;
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          student: true,
          gyms: true,
        },
      });

      if (!user) {
        set.status = 404;
        return { error: "Usuário não encontrado" };
      }

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          role: role as "STUDENT" | "GYM" | "ADMIN",
        },
      });

      if (role === "STUDENT" && !user.student) {
        const existingStudent = await db.student.findUnique({
          where: { userId },
        });

        if (!existingStudent) {
          await db.student.create({
            data: { userId },
          });
        }
      } else if (role === "GYM" && (!user.gyms || user.gyms.length === 0)) {
        const existingGym = await db.gym.findFirst({ where: { userId } });

        if (!existingGym) {
          await db.gym.create({
            data: {
              userId,
              name: user.name,
              address: "",
              phone: "",
              email: user.email,
              plan: "basic",
              isActive: true,
            },
          });
        }
      }

      return {
        success: true,
        user: {
          id: updatedUser.id,
          role: updatedUser.role,
        },
      };
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      return internalErrorResponse(set, "Erro ao atualizar tipo de usuário", error);
    }
  })
  .post("/forgot-password", async ({ body, set }) => {
    const validation = validateBody(body, forgotPasswordSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    try {
      const { email } = validation.data;
      const user = await db.user.findUnique({ where: { email } });

      if (user) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 15);

        await db.verificationToken.deleteMany({
          where: { identifier: `reset-password:${email}` },
        });

        await db.verificationToken.create({
          data: {
            identifier: `reset-password:${email}`,
            token: code,
            expires,
          },
        });

        try {
          await sendResetPasswordEmail({
            to: user.email,
            name: user.name,
            code,
          });
        } catch (emailError) {
          console.error("Erro ao enviar email de recuperação:", emailError);
        }
      }

      return {
        message:
          "Se o email estiver cadastrado, você receberá um código de verificação.",
      };
    } catch (error) {
      console.error(
        "Erro ao processar solicitação de recuperação de senha:",
        error
      );
      return internalErrorResponse(
        set,
        "Erro ao processar solicitação. Tente novamente.",
        error
      );
    }
  })
  .post("/verify-reset-code", async ({ body, set }) => {
    const validation = validateBody(body, verifyResetCodeSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    try {
      const { email, code } = validation.data;
      const verificationToken = await db.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier: `reset-password:${email}`,
            token: code,
          },
        },
      });

      if (!verificationToken) {
        set.status = 400;
        return { error: "Código inválido" };
      }

      if (new Date() > verificationToken.expires) {
        await db.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: `reset-password:${email}`,
              token: code,
            },
          },
        });

        set.status = 400;
        return { error: "Código expirado. Solicite um novo código." };
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        set.status = 404;
        return { error: "Usuário não encontrado" };
      }

      return {
        valid: true,
        message: "Código verificado com sucesso",
      };
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      return internalErrorResponse(set, "Erro ao verificar código", error);
    }
  })
  .post("/reset-password", async ({ body, set }) => {
    const validation = validateBody(body, resetPasswordSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    try {
      const { email, code, newPassword } = validation.data;
      const verificationToken = await db.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier: `reset-password:${email}`,
            token: code,
          },
        },
      });

      if (!verificationToken) {
        set.status = 400;
        return { error: "Código inválido" };
      }

      if (new Date() > verificationToken.expires) {
        await db.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: `reset-password:${email}`,
              token: code,
            },
          },
        });

        set.status = 400;
        return { error: "Código expirado. Solicite um novo código." };
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        set.status = 404;
        return { error: "Usuário não encontrado" };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `reset-password:${email}`,
            token: code,
          },
        },
      });

      return { message: "Senha redefinida com sucesso" };
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      return internalErrorResponse(set, "Erro ao redefinir senha", error);
    }
  });
