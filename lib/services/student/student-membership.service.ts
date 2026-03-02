import { db } from "@/lib/db";

/**
 * Serviço para operações de membership iniciadas pelo aluno.
 */
export class StudentMembershipService {
  /**
   * Cancela a matrícula do aluno na academia.
   * Valida que o membership pertence ao student.
   */
  static async cancelMembership(
    membershipId: string,
    studentId: string,
  ): Promise<void> {
    const membership = await db.gymMembership.findFirst({
      where: { id: membershipId, studentId },
      select: { id: true, gymId: true, status: true },
    });

    if (!membership) {
      throw new Error(
        "Matrícula não encontrada ou você não tem permissão para cancelá-la",
      );
    }

    await db.gymMembership.update({
      where: { id: membershipId },
      data: { status: "canceled" },
    });

    if (membership.status === "active") {
      await db.gymProfile.updateMany({
        where: { gymId: membership.gymId },
        data: {
          activeStudents: { decrement: 1 },
          totalStudents: { decrement: 1 },
        },
      });
      const { GymSubscriptionService } = await import(
        "@/lib/services/gym/gym-subscription.service"
      );
      await GymSubscriptionService.syncStudentEnterpriseBenefit(studentId);
    }
  }
}
