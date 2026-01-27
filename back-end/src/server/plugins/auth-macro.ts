import { Elysia } from "elysia";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";

export const authMacro = new Elysia({ name: "auth-macro" }).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({ headers });

      if (!session) {
        return status(401, { error: "Não autenticado" });
      }

      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
          student: { select: { id: true } },
          gyms: { select: { id: true } },
        },
      });

      if (!user) {
        return status(401, { error: "Usuário não encontrado" });
      }

      return {
        user: {
          ...user,
          student: user.student || undefined,
          gyms: user.gyms || [],
        },
        session: session.session,
        userId: user.id,
      };
    },
  },
});
