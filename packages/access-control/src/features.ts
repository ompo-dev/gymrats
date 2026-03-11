/**
 * features.ts
 *
 * Catálogo central de todas as "chaves" de features do sistema.
 * Não use strings hardcoded; importe esta constante.
 */

export const Features = {
  // 🧠 Inteligência Artificial
  USE_AI_WORKOUT: "use_ai_workout", // Gerador de Treino IA
  USE_AI_NUTRITION: "use_ai_nutrition", // Analisador/Gerador de Nutrição IA

  // 🏢 Academias (Gyms)
  ASSIGN_PERSONAL: "assign_personal", // Atribuir um personal trainer a um aluno matriculado
  BOOST_PLACEMENT: "boost_placement", // Comprar pacotes de impulsionamento na vitrine
  ADVANCED_REPORTS: "advanced_reports", // Relatórios financeiros mais avançados

  // 🔗 Rede Externa (Network) e Estudantes
  NETWORK_ACCESS: "network_access", // Aluno (PRO) ter acesso live às academias Enterprise
} as const;

// Tipagem baseada nos valores possíveis de Features
export type FeatureKey = (typeof Features)[keyof typeof Features];
