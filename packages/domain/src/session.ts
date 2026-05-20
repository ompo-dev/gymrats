import { db } from "@gymrats/db";
import { extractBearerToken } from "./auth-tokens";
import { generateSessionToken } from "./session-token";

const SESSION_DURATION_DAYS = 30;

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const token = generateSessionToken();

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
  const session = await db.session.findFirst({
    where: {
      OR: [{ token: sessionToken }, { sessionToken }],
    },
    include: {
      user: {
        include: {
          student: {
            select: {
              id: true,
              subscription: {
                select: {
                  plan: true,
                  status: true,
                  trialEnd: true,
                  currentPeriodEnd: true,
                },
              },
            },
          },
          personal: {
            select: {
              id: true,
              subscription: {
                select: {
                  plan: true,
                  status: true,
                  currentPeriodEnd: true,
                  trialEnd: true,
                },
              },
            },
          },
          gyms: {
            select: {
              id: true,
              plan: true,
              subscription: {
                select: {
                  plan: true,
                  status: true,
                  currentPeriodEnd: true,
                },
              },
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
    return null;
  }

  return session;
}

export async function deleteSession(sessionToken: string) {
  await db.session.deleteMany({
    where: {
      OR: [{ token: sessionToken }, { sessionToken }],
    },
  });
}

export async function deleteAllUserSessions(userId: string) {
  await db.session.deleteMany({
    where: { userId },
  });
}

export function getSessionTokenFromRequest(request: Request): string | null {
  return extractBearerToken(request.headers);
}
