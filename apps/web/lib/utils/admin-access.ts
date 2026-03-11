import { db } from "@/lib/db";
import { getSession } from "./session";

/**
 * Helper para obter acesso de gym para admins
 * Se o usuario for ADMIN e nao tiver perfil de gym, cria um automaticamente
 */
export async function getGymAccessForAdmin(
  sessionToken: string,
): Promise<{ gymId: string; isAdmin: boolean } | null> {
  const session = await getSession(sessionToken);
  if (!session) {
    return null;
  }

  const user = session.user;
  const primaryGym = user.gyms?.[0];

  if (user.role === "ADMIN") {
    if (primaryGym?.id) {
      return { gymId: primaryGym.id, isAdmin: true };
    }

    const existingGym = await db.gym.findFirst({
      where: { userId: user.id },
    });

    if (existingGym) {
      return { gymId: existingGym.id, isAdmin: true };
    }

    const gym = await db.gym.create({
      data: {
        userId: user.id,
        name: user.name || "Academia",
        address: "",
        phone: "",
        email: user.email || "",
        plan: "basic",
      },
    });

    return { gymId: gym.id, isAdmin: true };
  }

  if (primaryGym?.id) {
    return { gymId: primaryGym.id, isAdmin: false };
  }

  return null;
}

/**
 * Helper para obter acesso de student para admins
 * Se o usuario for ADMIN e nao tiver perfil de student, cria um automaticamente
 */
export async function getStudentAccessForAdmin(
  sessionToken: string,
): Promise<{ studentId: string; isAdmin: boolean } | null> {
  const session = await getSession(sessionToken);
  if (!session) {
    return null;
  }

  const user = session.user;

  if (user.role === "ADMIN") {
    if (user.student?.id) {
      return { studentId: user.student.id, isAdmin: true };
    }

    const existingStudent = await db.student.findUnique({
      where: { userId: user.id },
    });

    if (existingStudent) {
      return { studentId: existingStudent.id, isAdmin: true };
    }

    const student = await db.student.create({
      data: {
        userId: user.id,
      },
    });

    return { studentId: student.id, isAdmin: true };
  }

  if (user.student?.id) {
    return { studentId: user.student.id, isAdmin: false };
  }

  return null;
}

/**
 * Verifica se o usuario tem permissao de admin
 */
export async function isAdmin(sessionToken: string): Promise<boolean> {
  const session = await getSession(sessionToken);
  return session?.user?.role === "ADMIN";
}
