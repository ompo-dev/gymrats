import type { Equipment } from "@/lib/types";
import type { GymEquipmentScreenProps } from "./gym-equipment.screen";

interface GymEquipmentFixtureOverrides extends Partial<GymEquipmentScreenProps> {}

export function createGymEquipmentFixture(
  overrides: GymEquipmentFixtureOverrides = {},
): GymEquipmentScreenProps {
  return {
    equipment: [
      {
        id: "equipment-1",
        name: "Bike Indoor 07",
        type: "Cardio",
        brand: "Movement",
        model: "MX7",
        serialNumber: "BIKE-007",
        status: "in-use",
        currentUser: {
          studentId: "student-1",
          studentName: "Ana Souza",
          startTime: new Date(Date.now() - 15 * 60 * 1000),
        },
        usageStats: {
          totalUses: 84,
          avgUsageTime: 27,
          popularTimes: [],
        },
        maintenanceHistory: [],
        nextMaintenance: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        id: "equipment-2",
        name: "Leg Press 45",
        type: "Força",
        brand: "Lion",
        model: "LP45",
        serialNumber: "LP-045",
        status: "maintenance",
        usageStats: {
          totalUses: 65,
          avgUsageTime: 21,
          popularTimes: [],
        },
        maintenanceHistory: [],
      },
    ] as Equipment[],
    searchQuery: "",
    statusFilter: "all",
    statsOverview: {
      total: 2,
      available: 0,
      inUse: 1,
      maintenance: 1,
    },
    onSearchQueryChange: () => {},
    onStatusFilterChange: () => {},
    onOpenAddEquipment: () => {},
    onSelectEquipment: () => {},
    ...overrides,
  };
}
