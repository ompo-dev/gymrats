import { describe, expect, it } from "vitest";
import type { PersonalMetadata } from "@/lib/types/personal-unified";
import { resolvePersonalFinancialLoadErrors } from "./personal-financial-errors";

function createMetadata(
  overrides: Partial<PersonalMetadata>,
): PersonalMetadata {
  return {
    lastSync: null,
    isLoading: false,
    isInitialized: true,
    errors: {},
    resources: {},
    ...overrides,
  };
}

describe("resolvePersonalFinancialLoadErrors", () => {
  it("returns null errors when metadata is absent", () => {
    expect(resolvePersonalFinancialLoadErrors()).toEqual({
      financialSummary: null,
      payments: null,
    });
  });

  it("uses metadata.errors when resource is not in error state", () => {
    const metadata = createMetadata({
      errors: {
        financialSummary: "Resumo indisponivel",
        payments: "Pagamentos indisponiveis",
      },
      resources: {
        financialSummary: {
          status: "ready",
          lastStartedAt: null,
          lastFetchedAt: null,
          error: null,
        },
        payments: {
          status: "ready",
          lastStartedAt: null,
          lastFetchedAt: null,
          error: null,
        },
      },
    });

    expect(resolvePersonalFinancialLoadErrors(metadata)).toEqual({
      financialSummary: "Resumo indisponivel",
      payments: "Pagamentos indisponiveis",
    });
  });

  it("prioritizes resource error when section status is error", () => {
    const metadata = createMetadata({
      errors: {
        financialSummary: "Erro genérico",
        payments: "Erro genérico pagamentos",
      },
      resources: {
        financialSummary: {
          status: "error",
          lastStartedAt: null,
          lastFetchedAt: null,
          error: "Resumo falhou no backend",
        },
        payments: {
          status: "error",
          lastStartedAt: null,
          lastFetchedAt: null,
          error: null,
        },
      },
    });

    expect(resolvePersonalFinancialLoadErrors(metadata)).toEqual({
      financialSummary: "Resumo falhou no backend",
      payments: "Erro genérico pagamentos",
    });
  });
});
