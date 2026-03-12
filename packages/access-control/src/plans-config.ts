import type { StudentPlan, GymPlan, PersonalPlan } from "./types";

/**
 * plans-config.ts
 *
 * Single Source of Truth para todos os planos e preços do sistema.
 * Todos os valores de preços são armazenados em CENTAVOS para evitar erros de precisão.
 */

export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  features: string[];
  prices: {
    monthly: number; // centavos
    annual: number; // centavos
  };
}

export interface GymPlanConfig extends PlanConfig {
  prices: {
    monthly: number; // base centavos
    annual: number; // base centavos
  };
  pricePerStudent: number; // centavos
  pricePerPersonal?: number; // centavos por personal filiado no plano mensal
}

export interface PersonalPlanConfig extends PlanConfig {}

export const STUDENT_PLANS_CONFIG: Record<
  Exclude<StudentPlan, "FREE">,
  PlanConfig
> = {
  PREMIUM: {
    id: "premium",
    name: "Premium",
    description:
      "Treinos e dieta com IA, análise de postura e suporte prioritário.",
    features: [
      "Treinos personalizados com IA",
      "Planos de dieta com IA",
      "Acompanhamento de progresso e métricas",
      "Histórico de treinos e recordes",
      "Integração com academias parceiras",
    ],
    prices: {
      monthly: 600, // R$ 6,00
      annual: 6000, // R$ 60,00
    },
  },
  PRO: {
    id: "pro",
    name: "Pro",
    description:
      "Acesso livre a toda rede parceira, check-ins ilimitados e suporte ultra-prioritário.",
    features: [
      "Tudo do Premium",
      "Acesso livre a toda rede parceira (Gym Pass style)",
    ],
    prices: {
      monthly: 15000, // R$ 150,00
      annual: 150000, // R$ 1.500,00
    },
  },
};

export const GYM_PLANS_CONFIG: Record<GymPlan, GymPlanConfig> = {
  BASIC: {
    id: "basic",
    name: "Básico",
    description:
      "Ideal para academias individuais que buscam gestão eficiente.",
    features: [
      "1 unidade (uma academia)",
      "Gestão de alunos e check-ins",
      "Planos de mensalidade e cobrança",
      "Dashboard e relatórios básicos",
    ],
    prices: {
      monthly: 30000, // R$ 300,00
      annual: 300000, // R$ 3.000,00
    },
    pricePerStudent: 150, // R$ 1,50
    pricePerPersonal: 15000, // R$ 150,00
  },
  PREMIUM: {
    id: "premium",
    name: "Premium",
    description: "Perfeito para redes de academias e gestão avançada.",
    features: [
      "Todas as features do Plano Básico",
      "Múltiplas unidades (academias)",
      "Relatórios avançados e métricas",
      "Integrações (contabilidade, etc.)",
    ],
    prices: {
      monthly: 50000, // R$ 500,00
      annual: 500000, // R$ 5.000,00
    },
    pricePerStudent: 100, // R$ 1,00
    pricePerPersonal: 10000, // R$ 100,00
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    description: "Solução completa com benefícios exclusivos para seus alunos.",
    features: [
      "Todas as features do Plano Premium",
      "Plano Basic gratuito para todos os seus alunos",
    ],
    prices: {
      monthly: 70000, // R$ 700,00
      annual: 700000, // R$ 7.000,00
    },
    pricePerStudent: 50, // R$ 0,50
    pricePerPersonal: 5000, // R$ 50,00
  },
};

export const PERSONAL_PLANS_CONFIG: Record<PersonalPlan, PersonalPlanConfig> = {
  STANDARD: {
    id: "standard",
    name: "Standard",
    description:
      "Plano base para personais com gestão essencial e sem recursos avançados de IA.",
    features: [
      "Perfil profissional completo",
      "Gestão de alunos e acompanhamentos",
      "Vínculo com academias",
    ],
    prices: {
      monthly: 30000, // R$ 300,00
      annual: 300000, // R$ 3.000,00
    },
  },
  PRO_AI: {
    id: "pro_ai",
    name: "Pro AI",
    description:
      "Plano avançado para personais com recursos de IA para treino e nutrição.",
    features: [
      "Tudo do Standard",
      "Treinos com IA",
      "Suporte a recomendações com IA",
    ],
    prices: {
      monthly: 45000, // R$ 450,00
      annual: 450000, // R$ 4.500,00
    },
  },
};

// Helpers de Conversão e Formatação
export const centsToReais = (cents: number) => cents / 100;
export const reaisToCents = (reais: number) => Math.round(reais * 100);

/**
 * Formata um valor (em centavos ou reais) para a moeda brasileira.
 */
export const formatPlanCurrency = (
  value: number,
  unit: "cents" | "reais" = "reais",
) => {
  const amount = unit === "cents" ? centsToReais(value) : value;
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

/**
 * Retorna a configuração de um plano de estudante (tratado case-insensitive).
 */
export const getStudentPlanConfig = (planName: string) => {
  const p = planName.toUpperCase() as keyof typeof STUDENT_PLANS_CONFIG;
  return STUDENT_PLANS_CONFIG[p] || null;
};

/**
 * Retorna a configuração de um plano de academia (tratado case-insensitive).
 */
export const getGymPlanConfig = (planName: string) => {
  const p = planName.toUpperCase() as keyof typeof GYM_PLANS_CONFIG;
  return GYM_PLANS_CONFIG[p] || null;
};

/**
 * Retorna a configuração de um plano de personal (tratado case-insensitive).
 */
export const getPersonalPlanConfig = (planName: string) => {
  const p = planName.toUpperCase() as keyof typeof PERSONAL_PLANS_CONFIG;
  return PERSONAL_PLANS_CONFIG[p] || null;
};
