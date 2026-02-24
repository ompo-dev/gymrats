import { db } from "@/lib/db";

/**
 * Service to centralize gym domain operations and stat updates
 */
export class GymDomainService {
  /**
   * Increments equipment count for a gym
   */
  static async incrementEquipmentCount(gymId: string) {
    return db.gymProfile.update({
      where: { gymId },
      data: { equipmentCount: { increment: 1 } },
    });
  }

  /**
   * Adds XP to a gym profile
   */
  static async addGymXP(gymId: string, amount: number) {
    return db.gymProfile.updateMany({
      where: { gymId },
      data: { xp: { increment: amount } },
    });
  }

  /**
   * Updates student counters when a new membership is created
   */
  static async incrementStudentCounters(gymId: string) {
    return db.gymProfile.updateMany({
      where: { gymId },
      data: {
        totalStudents: { increment: 1 },
        activeStudents: { increment: 1 },
      },
    });
  }
}
