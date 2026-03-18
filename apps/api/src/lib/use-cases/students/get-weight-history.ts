/**
 * Use Case: Get Weight History
 * Busca historico de peso com suporte a paginacao e filtros de data.
 */

import {
  deleteCacheKeysByPrefix,
  getCachedJson,
  setCachedJson,
} from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";

export interface GetWeightHistoryInput {
  studentId: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

export interface WeightEntry {
  date: Date;
  weight: number;
  notes?: string;
}

export interface GetWeightHistoryOutput {
  history: WeightEntry[];
  total: number;
  limit: number;
  offset: number;
  weightGain?: number | null;
  summary?: {
    currentWeight: number | null;
    previousWeight: number | null;
    lastRecordedAt: Date | null;
  };
}

const WEIGHT_HISTORY_CACHE_TTL_SECONDS = 30;

function buildWeightHistoryCacheKey(input: GetWeightHistoryInput) {
  return [
    "student-weight",
    input.studentId,
    `limit:${input.limit ?? 30}`,
    `offset:${input.offset ?? 0}`,
    `start:${input.startDate ?? "-"}`,
    `end:${input.endDate ?? "-"}`,
  ].join(":");
}

export async function invalidateWeightHistoryCache(studentId: string) {
  await deleteCacheKeysByPrefix(`student-weight:${studentId}:`);
}

export async function getWeightHistoryUseCase(
  input: GetWeightHistoryInput,
): Promise<GetWeightHistoryOutput> {
  const { studentId, limit = 30, offset = 0, startDate, endDate } = input;
  const cacheKey = buildWeightHistoryCacheKey({
    studentId,
    limit,
    offset,
    startDate,
    endDate,
  });

  const cached = await getCachedJson<GetWeightHistoryOutput>(cacheKey);
  if (cached) {
    return {
      ...cached,
      history: cached.history.map((entry) => ({
        ...entry,
        date: new Date(entry.date),
      })),
      summary: cached.summary
        ? {
            ...cached.summary,
            lastRecordedAt: cached.summary.lastRecordedAt
              ? new Date(cached.summary.lastRecordedAt)
              : null,
          }
        : undefined,
    };
  }

  const where: {
    studentId: string;
    date?: { gte?: Date; lte?: Date };
  } = { studentId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const currentWeightPromise = db.weightHistory.findFirst({
    where: { studentId },
    orderBy: { date: "desc" },
    select: {
      date: true,
      weight: true,
    },
  });

  const [weightHistory, total, currentWeightEntry] = await Promise.all([
    db.weightHistory.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
      select: {
        date: true,
        weight: true,
        notes: true,
      },
    }),
    db.weightHistory.count({ where }),
    currentWeightPromise,
  ]);

  const history: WeightEntry[] = weightHistory.map((entry) => ({
    date: entry.date,
    weight: entry.weight,
    notes: entry.notes || undefined,
  }));

  let weightGain: number | null | undefined;
  let previousWeight: number | null = null;

  if (!startDate && !endDate && history.length > 0) {
    const currentWeight = history[0].weight;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const pastEntry = await db.weightHistory.findFirst({
      where: {
        studentId,
        date: { lte: oneMonthAgo },
      },
      orderBy: { date: "desc" },
      select: {
        weight: true,
      },
    });

    weightGain = pastEntry ? currentWeight - pastEntry.weight : null;
    previousWeight = pastEntry?.weight ?? null;
  }

  const payload = {
    history,
    total,
    limit,
    offset,
    weightGain,
    summary: {
      currentWeight: currentWeightEntry?.weight ?? null,
      previousWeight,
      lastRecordedAt: currentWeightEntry?.date ?? null,
    },
  } satisfies GetWeightHistoryOutput;

  await setCachedJson(cacheKey, payload, WEIGHT_HISTORY_CACHE_TTL_SECONDS);

  return payload;
}
