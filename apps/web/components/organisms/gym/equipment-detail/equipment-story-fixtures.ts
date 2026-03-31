import type { Equipment } from "@/lib/types";

const baseEquipment: Equipment = {
  id: "eq-legpress-01",
  name: "Leg Press 45",
  type: "musculacao",
  brand: "Movement",
  model: "LPX-450",
  serialNumber: "LP-2024-045",
  purchaseDate: new Date("2024-02-10T12:00:00.000Z"),
  lastMaintenance: new Date("2026-02-20T15:00:00.000Z"),
  nextMaintenance: new Date("2026-05-20T15:00:00.000Z"),
  status: "available",
  usageStats: {
    totalUses: 1460,
    avgUsageTime: 18,
    popularTimes: ["07:00 - 09:00", "18:00 - 20:00", "20:00 - 21:30"],
  },
  maintenanceHistory: [
    {
      id: "mt-001",
      date: new Date("2026-02-20T15:00:00.000Z"),
      type: "preventive",
      description: "Lubrificacao geral e calibracao da estrutura",
      performedBy: "Equipe Tecnica GymRats",
      cost: 450,
      nextScheduled: new Date("2026-05-20T15:00:00.000Z"),
    },
    {
      id: "mt-002",
      date: new Date("2025-11-18T15:00:00.000Z"),
      type: "inspection",
      description: "Inspecao trimestral de seguranca",
      performedBy: "Quality Motion",
    },
  ],
  qrCode: "QR-EQ-LEGPRESS-01",
};

export const availableEquipmentFixture: Equipment = baseEquipment;

export const inUseEquipmentFixture: Equipment = {
  ...baseEquipment,
  id: "eq-legpress-02",
  status: "in-use",
  currentUser: {
    studentId: "student-ana-01",
    studentName: "Ana Souza",
    startTime: new Date(Date.now() - 38 * 60 * 1000),
  },
};

export const maintenanceEmptyEquipmentFixture: Equipment = {
  ...baseEquipment,
  id: "eq-bike-03",
  name: "Bike Ergometrica",
  type: "cardio",
  status: "maintenance",
  lastMaintenance: undefined,
  nextMaintenance: undefined,
  maintenanceHistory: [],
  usageStats: {
    totalUses: 240,
    avgUsageTime: 27,
    popularTimes: ["06:00 - 08:00", "17:00 - 19:00"],
  },
};
