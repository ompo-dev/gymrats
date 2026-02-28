/**
 * Utilitários para exercícios de workout
 */

export interface EducationalDataInput {
  primaryMuscles?: string[] | string;
  secondaryMuscles?: string[] | string;
  equipment?: string[] | string;
  instructions?: string[] | string;
  tips?: string[] | string;
  commonMistakes?: string[] | string;
  benefits?: string[] | string;
  [key: string]: string | string[] | null | undefined;
}

/**
 * Normaliza dados educacionais para formato do banco (JSON string)
 */
export function normalizeEducationalData(
  data: EducationalDataInput
): Record<string, string | null> {
  const normalized: Record<string, string | string[] | null | undefined> = {
    ...data,
  };

  const arrayFields = [
    "primaryMuscles",
    "secondaryMuscles",
    "equipment",
    "instructions",
    "tips",
    "commonMistakes",
    "benefits",
  ];

  for (const field of arrayFields) {
    if (normalized[field] !== undefined && normalized[field] !== null) {
      if (typeof normalized[field] === "string") {
        try {
          JSON.parse(normalized[field] as string);
        } catch {
          normalized[field] = null;
        }
      } else if (Array.isArray(normalized[field])) {
        normalized[field] =
          (normalized[field] as string[]).length > 0
            ? JSON.stringify(normalized[field])
            : null;
      } else {
        normalized[field] = null;
      }
    }
  }

  return normalized as Record<string, string | null>;
}
