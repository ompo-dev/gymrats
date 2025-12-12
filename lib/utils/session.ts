import { db } from "@/lib/db"

const SESSION_DURATION_DAYS = 30

export async function createSession(userId: string): Promise<string> {
  const expires = new Date()
  expires.setDate(expires.getDate() + SESSION_DURATION_DAYS)

  const sessionToken = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`

  await db.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  })

  return sessionToken
}

export async function getSession(sessionToken: string) {
  const session = await db.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        include: {
          student: {
            select: {
              id: true,
            },
          },
          gym: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  if (!session) {
    return null
  }

  if (session.expires < new Date()) {
    await db.session.delete({
      where: { sessionToken },
    })
    return null
  }

  // Se for ADMIN, garantir que tenha acesso a ambos os perfis
  if (session.user.role === "ADMIN") {
    // Verificar e criar perfil de gym se não existir
    if (!session.user.gym) {
      const existingGym = await db.gym.findUnique({
        where: { userId: session.user.id },
      })
      
      if (!existingGym) {
        await db.gym.create({
          data: {
            userId: session.user.id,
            name: session.user.name,
            address: "",
            phone: "",
            email: session.user.email,
            plan: "basic",
          },
        })
      }
    }

    // Verificar e criar perfil de student se não existir
    if (!session.user.student) {
      const existingStudent = await db.student.findUnique({
        where: { userId: session.user.id },
      })
      
      if (!existingStudent) {
        await db.student.create({
          data: {
            userId: session.user.id,
          },
        })
      }
    }

    // Recarregar a sessão com os perfis criados
    const updatedSession = await db.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            student: {
              select: {
                id: true,
              },
            },
            gym: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    return updatedSession
  }

  return session
}

export async function deleteSession(sessionToken: string) {
  await db.session.deleteMany({
    where: { sessionToken },
  })
}

export async function deleteAllUserSessions(userId: string) {
  await db.session.deleteMany({
    where: { userId },
  })
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    return authHeader.replace("Bearer ", "")
  }
  return null
}

