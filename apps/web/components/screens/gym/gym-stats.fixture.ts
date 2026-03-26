import type { Equipment, GymStats } from "@/lib/types";
import type { GymStatsScreenProps } from "./gym-stats.screen";

interface GymStatsFixtureOverrides extends Partial<GymStatsScreenProps> {}

export function createGymStatsFixture(
  overrides: GymStatsFixtureOverrides = {},
): GymStatsScreenProps {
  return {
    stats: {
      today: {
        checkins: 48,
        peakHour: "18:00",
        activeStudents: 39,
        equipmentInUse: 11,
      },
      week: {
        totalCheckins: 298,
        avgDailyCheckins: 43,
        newMembers: 6,
        canceledMembers: 1,
        checkinsByDay: [
          { day: "Seg", dayKey: "mon", checkins: 38 },
          { day: "Ter", dayKey: "tue", checkins: 45 },
          { day: "Qua", dayKey: "wed", checkins: 52 },
        ],
        checkinsByHour: [
          { hour: "08:00", hourNum: 8, checkins: 14 },
          { hour: "18:00", hourNum: 18, checkins: 31 },
          { hour: "20:00", hourNum: 20, checkins: 24 },
        ],
      },
      month: {
        totalCheckins: 1190,
        retentionRate: 88,
        growthRate: 12,
        topStudents: [],
        mostUsedEquipment: [],
      },
    } as GymStats,
    equipment: [
      {
        id: "equipment-1",
        name: "Bike Indoor 07",
        usageStats: {
          totalUses: 84,
          avgUsageTime: 27,
        },
      },
      {
        id: "equipment-2",
        name: "Leg Press 45",
        usageStats: {
          totalUses: 65,
          avgUsageTime: 21,
        },
      },
    ] as Equipment[],
    ...overrides,
  };
}
