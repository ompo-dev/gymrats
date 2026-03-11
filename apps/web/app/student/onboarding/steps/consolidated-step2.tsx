"use client";

import { Step5 } from "./step5";
import type { StepProps } from "./types";

/**
 * Etapa 2 - "Seu plano"
 * Reutiliza Step5 para exibir valores metabólicos calculados (TMB, TDEE, calorias, macros).
 * Sem input do usuário — apenas confirmação visual.
 */
export function ConsolidatedStep2(props: StepProps) {
  return <Step5 {...props} />;
}
