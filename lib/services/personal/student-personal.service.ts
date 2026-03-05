import { db } from "@/lib/db";

export class StudentPersonalService {
  static async searchStudentByEmail(personalId: string, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedIdentifier = normalizedEmail.startsWith("@")
      ? normalizedEmail.slice(1)
      : normalizedEmail;
    const isFullEmail = normalizedIdentifier.includes("@");

    const emailWhere = isFullEmail
      ? { contains: normalizedIdentifier, mode: "insensitive" as const }
      : {
          startsWith: `${normalizedIdentifier}@`,
          mode: "insensitive" as const,
        };

    const user = await db.user.findFirst({
      where: {
        email: emailWhere,
        role: { in: ["STUDENT", "ADMIN"] },
      },
      include: {
        student: {
          include: {
            profile: true,
            progress: true,
            personalAssignments: {
              where: {
                personalId,
                status: "active",
              },
            },
          },
        },
      },
    });

    if (!user?.student) {
      return { found: false };
    }

    const existingAssignment = user.student.personalAssignments[0];
    return {
      found: true,
      isAlreadyAssigned: !!existingAssignment,
      student: {
        id: user.student.id,
        name: user.name,
        email: user.email,
        avatar: user.student.avatar,
        age: user.student.age,
        gender: user.student.gender,
        currentLevel: user.student.progress?.currentLevel ?? 1,
        currentStreak: user.student.progress?.currentStreak ?? 0,
      },
    };
  }
  static async assignByGym(input: {
    studentId: string;
    personalId: string;
    gymId: string;
  }) {
    const { studentId, personalId, gymId } = input;

    const affiliation = await db.gymPersonalAffiliation.findUnique({
      where: { personalId_gymId: { personalId, gymId } },
      select: { status: true },
    });
    if (!affiliation || affiliation.status !== "active") {
      throw new Error("Personal não está filiado à academia");
    }

    const existing = await db.studentPersonalAssignment.findUnique({
      where: { studentId_personalId: { studentId, personalId } },
    });

    if (existing) {
      return db.studentPersonalAssignment.update({
        where: { id: existing.id },
        data: {
          gymId,
          assignedBy: "GYM",
          status: "active",
        },
      });
    }

    return db.studentPersonalAssignment.create({
      data: {
        studentId,
        personalId,
        gymId,
        assignedBy: "GYM",
        status: "active",
      },
    });
  }

  static async assignByPersonal(input: {
    studentId: string;
    personalId: string;
    gymId?: string;
  }) {
    const { studentId, personalId, gymId } = input;

    if (gymId) {
      const affiliation = await db.gymPersonalAffiliation.findUnique({
        where: { personalId_gymId: { personalId, gymId } },
        select: { status: true },
      });
      if (!affiliation || affiliation.status !== "active") {
        throw new Error("Personal não está filiado à academia informada");
      }
    }

    const existing = await db.studentPersonalAssignment.findUnique({
      where: { studentId_personalId: { studentId, personalId } },
    });

    if (existing) {
      return db.studentPersonalAssignment.update({
        where: { id: existing.id },
        data: {
          gymId: gymId ?? null,
          assignedBy: "PERSONAL",
          status: "active",
        },
      });
    }

    return db.studentPersonalAssignment.create({
      data: {
        studentId,
        personalId,
        gymId: gymId ?? null,
        assignedBy: "PERSONAL",
        status: "active",
      },
    });
  }

  static async removeAssignment(input: { studentId: string; personalId: string }) {
    const { studentId, personalId } = input;

    const existing = await db.studentPersonalAssignment.findUnique({
      where: { studentId_personalId: { studentId, personalId } },
    });
    if (!existing) return null;

    return db.studentPersonalAssignment.update({
      where: { id: existing.id },
      data: { status: "removed" },
    });
  }

  static async listPersonalsByStudent(studentId: string) {
    return db.studentPersonalAssignment.findMany({
      where: { studentId, status: "active" },
      include: {
        personal: true,
        gym: {
          select: { id: true, name: true, image: true, logo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getStudentDetailForPersonal(
    personalId: string,
    studentId: string,
  ) {
    const assignment = await db.studentPersonalAssignment.findFirst({
      where: {
        studentId,
        personalId,
        status: "active",
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            profile: true,
            progress: true,
            records: {
              orderBy: { date: "desc" },
              take: 50,
              select: {
                exerciseName: true,
                date: true,
                value: true,
                type: true,
              },
            },
          },
        },
        gym: { select: { id: true, name: true } },
      },
    });
    return assignment;
  }

  static async listStudentsByPersonal(personalId: string, gymId?: string) {
    return db.studentPersonalAssignment.findMany({
      where: {
        personalId,
        status: "active",
        ...(gymId ? { gymId } : {}),
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            profile: true,
            progress: true,
          },
        },
        gym: {
          select: { id: true, name: true, image: true, logo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
