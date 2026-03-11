import { Elysia } from "elysia";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";

async function resolveSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      student: true,
      gyms: true,
    },
  });

  if (!user) {
    return null;
  }

  return { session, user };
}

export const authRolesMacro = new Elysia({ name: "auth-roles" }).macro({
  requireStudent: {
    async resolve({ status, request: { headers } }) {
      const result = await resolveSession(headers);
      if (!result) {
        return status(401, { error: "Não autenticado" });
      }

      const { user } = result;
      const isAdmin = user.role === "ADMIN";

      if (!isAdmin && !user.student) {
        return status(403, {
          error: "Acesso negado: requer role STUDENT ou ADMIN",
        });
      }

      let student = user.student;
      if (isAdmin && !student) {
        const existingStudent = await db.student.findUnique({
          where: { userId: user.id },
        });

        student =
          existingStudent ??
          (await db.student.create({
            data: {
              userId: user.id,
            },
          }));
      }

      if (!student) {
        return status(500, { error: "Student ID não encontrado" });
      }

      return {
        user: {
          ...user,
          studentId: student.id,
          student,
        },
        userId: user.id,
        studentId: student.id,
      };
    },
  },
  requireGym: {
    async resolve({ status, request: { headers } }) {
      const result = await resolveSession(headers);
      if (!result) {
        return status(401, { error: "Não autenticado" });
      }

      const { user } = result;
      const isAdmin = user.role === "ADMIN";

      if (!isAdmin && (!user.gyms || user.gyms.length === 0)) {
        return status(403, {
          error: "Acesso negado: requer role GYM ou ADMIN",
        });
      }

      return {
        user,
        userId: user.id,
      };
    },
  },
  requireAdmin: {
    async resolve({ status, request: { headers } }) {
      const result = await resolveSession(headers);
      if (!result) {
        return status(401, { error: "Não autenticado" });
      }

      const { user } = result;
      if (user.role !== "ADMIN") {
        return status(403, { error: "Acesso negado: requer role ADMIN" });
      }

      return {
        user,
        userId: user.id,
      };
    },
  },
});
