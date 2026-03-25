import type { Equipment, MaintenanceRecord } from "@/lib/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function normalizeMaintenanceRecord(value: unknown): MaintenanceRecord {
  const source = asRecord(value);

  return {
    id: String(source?.id ?? ""),
    date: asDate(source?.date) ?? new Date(),
    type:
      source?.type === "preventive" ||
      source?.type === "corrective" ||
      source?.type === "inspection"
        ? source.type
        : "inspection",
    description: String(source?.description ?? ""),
    performedBy: String(source?.performedBy ?? ""),
    cost: typeof source?.cost === "number" ? source.cost : undefined,
    nextScheduled: asDate(source?.nextScheduled),
  };
}

export function normalizeEquipmentItem(value: unknown): Equipment {
  const source = asRecord(value);
  const usageStats = asRecord(source?.usageStats);
  const currentUser = asRecord(source?.currentUser);

  return {
    id: String(source?.id ?? ""),
    name: String(source?.name ?? ""),
    type: String(source?.type ?? ""),
    brand: typeof source?.brand === "string" ? source.brand : undefined,
    model: typeof source?.model === "string" ? source.model : undefined,
    serialNumber:
      typeof source?.serialNumber === "string"
        ? source.serialNumber
        : undefined,
    purchaseDate: asDate(source?.purchaseDate),
    lastMaintenance: asDate(source?.lastMaintenance),
    nextMaintenance: asDate(source?.nextMaintenance),
    status:
      source?.status === "in-use" ||
      source?.status === "maintenance" ||
      source?.status === "broken"
        ? source.status
        : "available",
    currentUser: currentUser
      ? {
          studentId: String(currentUser.studentId ?? ""),
          studentName: String(currentUser.studentName ?? "Aluno"),
          startTime: asDate(currentUser.startTime) ?? new Date(),
        }
      : source?.currentUserId
        ? {
            studentId: String(source.currentUserId),
            studentName:
              typeof source.currentUserName === "string"
                ? source.currentUserName
                : "Aluno",
            startTime: asDate(source.currentStartTime) ?? new Date(),
          }
        : undefined,
    usageStats: {
      totalUses: asNumber(usageStats?.totalUses),
      avgUsageTime: asNumber(usageStats?.avgUsageTime),
      popularTimes: asStringArray(usageStats?.popularTimes),
    },
    maintenanceHistory: Array.isArray(source?.maintenanceHistory)
      ? source.maintenanceHistory.map(normalizeMaintenanceRecord)
      : [],
    qrCode: typeof source?.qrCode === "string" ? source.qrCode : undefined,
  };
}

export function normalizeEquipmentList(value: unknown): Equipment[] {
  return Array.isArray(value) ? value.map(normalizeEquipmentItem) : [];
}
