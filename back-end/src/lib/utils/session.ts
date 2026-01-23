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
      token,
      userId,
      expiresAt,
      sessionToken: token,
      expires: expiresAt,
    },
  });

  return token;
}

export async function getSession(sessionToken: string) {
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

  const expiresAt = session.expiresAt || session.expires;
  if (expiresAt && expiresAt < new Date()) {
    await db.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  if (session.user.role === "ADMIN" || session.user.role === "GYM") {
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
          where: { id: session.user.id },
          data: { activeGymId: newGym.id },
        });
      } else if (!session.user.activeGymId) {
        await db.user.update({
          where: { id: session.user.id },
          data: { activeGymId: existingGyms[0].id },
        });
      }
    }

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
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    return token || null;
  }
  return null;
}
