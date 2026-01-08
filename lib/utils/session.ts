import { db } from "@/lib/db";

const SESSION_DURATION_DAYS = 30;

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const token = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;

  await db.session.create({
    data: {
      token, // Better Auth usa 'token'
      userId,
      expiresAt, // Better Auth usa 'expiresAt'
      // Campos legacy para compatibilidade
      sessionToken: token,
      expires: expiresAt,
    },
  });

  return token;
}

export async function getSession(sessionToken: string) {
  // Tentar buscar por token (Better Auth) primeiro, depois por sessionToken (legacy)
  let session = await db.session.findFirst({
    where: {
      OR: [{ token: sessionToken }, { sessionToken: sessionToken }],
    },
    include: {
      user: {
        include: {
          student: {
            select: {
              id: true,
            },
          },
          gyms: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Verificar expiração usando expiresAt (Better Auth) ou expires (legacy)
  const expiresAt = session.expiresAt || session.expires;
  if (expiresAt && expiresAt < new Date()) {
    await db.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  // Se for ADMIN ou GYM, garantir que tenha perfil de gym
  if (session.user.role === "ADMIN" || session.user.role === "GYM") {
    // Verificar se tem pelo menos uma gym
    if (!session.user.gyms || session.user.gyms.length === 0) {
      const existingGyms = await db.gym.findMany({
        where: { userId: session.user.id },
      });

      if (existingGyms.length === 0) {
        const newGym = await db.gym.create({
          data: {
            userId: session.user.id,
            name: session.user.name,
            address: "",
            phone: "",
            email: session.user.email,
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

        // Definir como activeGymId
        await db.user.update({
          where: { id: session.user.id },
          data: { activeGymId: newGym.id },
        });
      } else if (!session.user.activeGymId) {
        // Se tem gyms mas não tem activeGymId, definir a primeira
        await db.user.update({
          where: { id: session.user.id },
          data: { activeGymId: existingGyms[0].id },
        });
      }
    }

    // Verificar e criar perfil de student se for ADMIN
    if (session.user.role === "ADMIN" && !session.user.student) {
      const existingStudent = await db.student.findUnique({
        where: { userId: session.user.id },
      });

      if (!existingStudent) {
        await db.student.create({
          data: {
            userId: session.user.id,
          },
        });
      }
    }

    // Recarregar a sessão com os perfis criados
    const updatedSession = await db.session.findFirst({
      where: {
        OR: [{ token: sessionToken }, { sessionToken: sessionToken }],
      },
      include: {
        user: {
          include: {
            student: {
              select: {
                id: true,
              },
            },
            gyms: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    return updatedSession;
  }

  return session;
}

export async function deleteSession(sessionToken: string) {
  await db.session.deleteMany({
    where: {
      OR: [{ token: sessionToken }, { sessionToken: sessionToken }],
    },
  });
}

export async function deleteAllUserSessions(userId: string) {
  await db.session.deleteMany({
    where: { userId },
  });
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    // Remover "Bearer " e fazer trim para remover espaços
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    return token || null;
  }
  return null;
}
