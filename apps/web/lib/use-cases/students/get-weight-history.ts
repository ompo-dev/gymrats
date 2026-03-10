/**
 * Use Case: Get Weight History
 * Busca histórico de peso com suporte a paginação e filtros de data.
 */

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
  /** Variação de peso vs. 1 mês atrás (pode ser null se não houver comparação) */
  weightGain?: number | null;
}

export async function getWeightHistoryUseCase(
  input: GetWeightHistoryInput,
): Promise<GetWeightHistoryOutput> {
  const { studentId, limit = 30, offset = 0, startDate, endDate } = input;

  const where: {
    studentId: string;
    date?: { gte?: Date; lte?: Date };
  } = { studentId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [weightHistory, total] = await Promise.all([
    db.weightHistory.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    db.weightHistory.count({ where }),
  ]);

  const history: WeightEntry[] = weightHistory.map((wh) => ({
    date: wh.date,
    weight: wh.weight,
    notes: wh.notes || undefined,
  }));

  // Calcular variação de peso vs mês anterior (apenas quando sem filtros)
  let weightGain: number | null | undefined;
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
    });

    weightGain = pastEntry ? currentWeight - pastEntry.weight : null;
  }

  return { history, total, limit, offset, weightGain };
}
