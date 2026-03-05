import { db } from "@/lib/db";

export class StudentPersonalService {
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
