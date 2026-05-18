import type { PersonalMetadata } from "@/lib/types/personal-unified";

export interface PersonalFinancialLoadErrors {
  financialSummary: string | null;
  payments: string | null;
}

const DEFAULT_SECTION_ERROR = "Falha ao carregar este recurso.";

function resolveSectionError(
  metadata: PersonalMetadata | null | undefined,
  section: "financialSummary" | "payments",
) {
  const resource = metadata?.resources?.[section];
  const metadataError = metadata?.errors?.[section] ?? null;

  if (resource?.status === "error") {
    return resource.error || metadataError || DEFAULT_SECTION_ERROR;
  }

  return metadataError;
}

export function resolvePersonalFinancialLoadErrors(
  metadata?: PersonalMetadata | null,
): PersonalFinancialLoadErrors {
  return {
    financialSummary: resolveSectionError(metadata, "financialSummary"),
    payments: resolveSectionError(metadata, "payments"),
  };
}
