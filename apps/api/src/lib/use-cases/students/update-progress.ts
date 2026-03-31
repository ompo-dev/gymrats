import type { z } from "zod";
import type { updateStudentProgressSchema } from "@/lib/api/schemas/students.schemas";
import { db } from "@/lib/db";

export type UpdateStudentProgressInput = z.infer<
  typeof updateStudentProgressSchema
>;

export interface UpdateStudentProgressDeps {
  studentId: string;
  data: UpdateStudentProgressInput;
}

export interface UpdateStudentProgressResult {
  message: string;
}

/**
 * Caso de uso: atualizar progresso do student
 *
 * - Cria studentProgress se ainda não existir
 * - Atualiza campos conforme schema
 * - Converte lastActivityDate de string para Date, se fornecido
 */
export async function updateStudentProgressUseCase(
  deps: UpdateStudentProgressDeps,
): Promise<UpdateStudentProgressResult> {
  const { studentId, data } = deps;

  const existing = await db.studentProgress.findUnique({
    where: { studentId },
  });

  if (!existing) {
    await db.studentProgress.create({
      data: {
        studentId,
        ...data,
      },
    });
  } else {
    await db.studentProgress.update({
      where: { studentId },
      data: {
        ...data,
        lastActivityDate:
          typeof data.lastActivityDate === "string"
            ? new Date(data.lastActivityDate)
            : undefined,
      },
    });
  }

  return { message: "Progresso atualizado com sucesso" };
}
