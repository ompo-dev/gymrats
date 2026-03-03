import {
  GYM_PLANS_CONFIG,
  STUDENT_PLANS_CONFIG,
  getGymPlanConfig,
  getStudentPlanConfig,
} from "@/lib/access-control/plans-config";
import type { CreateBillingRequest } from "@/lib/api/abacatepay";
import { abacatePay } from "@/lib/api/abacatepay";
import { db } from "@/lib/db";

/** Resposta PIX QRCode - usado para gym (valor dinâmico, sem criar produtos) */
export interface GymSubscriptionPixResponse {
  id: string;
  brCode: string;
  brCodeBase64: string;
  amount: number; // centavos
}

// Re-exportar utilitários puros para que imports server-side existentes continuem funcionando.
// Para imports em componentes client-side, use "@/lib/utils/subscription-helpers" diretamente.
export {
  getBillingPeriodFromPlan,
  hasActivePremiumStatus,
  isBasicPlan,
  isPremiumPlan,
} from "./subscription-helpers";

import {
  hasActivePremiumStatus,
  isBasicPlan,
  isPremiumPlan,
} from "./subscription-helpers";

// ─── Funções com acesso ao DB ─────────────────────────────────────────────────

export async function hasPremiumAccess(studentId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { studentId },
  });

  // Premium ativo via assinatura própria
  if (subscription && isPremiumPlan(subscription.plan)) {
    if (hasActivePremiumStatus(subscription)) {
      return true;
    }
  }

  // Premium gratuito via academia Enterprise (source GYM_ENTERPRISE + plan premium)
  const subWithSource = subscription as typeof subscription & {
    source?: string;
  };
  if (
    subscription &&
    subWithSource.source === "GYM_ENTERPRISE" &&
    isPremiumPlan(subscription.plan) &&
    subscription.status === "active"
  ) {
    return true;
  }

  return false;
}

export async function hasBasicAccess(studentId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { studentId },
  });

  // 1. Verificar se tem plano basic ou superior ativo via assinatura própria
  if (subscription && isBasicPlan(subscription.plan)) {
    if (subscription.status === "canceled" || subscription.status === "expired")
      return false;
    const now = new Date();
    const trialActive =
      subscription.trialEnd && new Date(subscription.trialEnd) > now;
    if (
      subscription.status === "active" ||
      subscription.status === "trialing" ||
      trialActive
    ) {
      return true;
    }
  }

  // 2. Verificar se tem assinatura via gym enterprise (Basic ou Premium gratuito)
  const subWithSource = subscription as typeof subscription & {
    source?: string;
    enterpriseGymId?: string | null;
  };
  if (
    subscription &&
    subWithSource.source === "GYM_ENTERPRISE" &&
    subscription.status === "active"
  ) {
    if (
      subscription.plan === "basic" ||
      isBasicPlan(subscription.plan) ||
      isPremiumPlan(subscription.plan)
    ) {
      return true;
    }
  }

  // 3. Fallback/Virtual: Verificar se está em academia enterprise ativa
  const membership = await db.gymMembership.findFirst({
    where: {
      studentId,
      status: "active",
      gym: {
        subscription: {
          plan: "enterprise",
          status: "active",
        },
      },
    },
  });

  if (membership) {
    return true;
  }

  return false;
}

export interface SubscriptionSourceInfo {
  plan: string;
  status: string;
  source: "OWN" | "GYM_ENTERPRISE" | null;
  gymId?: string;
}

export async function getStudentSubscriptionSource(
  studentId: string,
): Promise<SubscriptionSourceInfo> {
  // 1. Prioridade: benefício Enterprise (membership ativa em academia enterprise)
  const enterpriseMembership = await db.gymMembership.findFirst({
    where: {
      studentId,
      status: "active",
      gym: {
        isActive: true,
        subscription: {
          plan: "enterprise",
          status: "active",
        },
      },
    },
    select: { gymId: true },
  });
  if (enterpriseMembership) {
    return {
      plan: "premium",
      status: "active",
      source: "GYM_ENTERPRISE",
      gymId: enterpriseMembership.gymId,
    };
  }

  const subscription = await db.subscription.findUnique({
    where: { studentId },
  });
  const subWithSource = subscription as typeof subscription & {
    source?: string;
    enterpriseGymId?: string | null;
  };

  // 2. Assinatura própria ativa (GYM_ENTERPRISE no registro ou OWN ativa/trial)
  if (subscription && subWithSource.source === "GYM_ENTERPRISE") {
    return {
      plan: subscription.plan,
      status: subscription.status,
      source: "GYM_ENTERPRISE",
      gymId: subWithSource.enterpriseGymId || undefined,
    };
  }

  if (subscription) {
    const isCanceled =
      subscription.status === "canceled" || subscription.status === "expired";
    const isTrialActive =
      subscription.trialEnd && new Date(subscription.trialEnd) > new Date();
    if (isCanceled && !isTrialActive) {
      return { plan: "free", status: "inactive", source: null };
    }
    return {
      plan: subscription.plan,
      status: subscription.status,
      source: "OWN",
    };
  }

  return {
    plan: "free",
    status: "inactive",
    source: null,
  };
}

export async function canUseFeature(
  studentId: string,
  featureKey: string,
): Promise<boolean> {
  const hasPremium = await hasPremiumAccess(studentId);

  if (!hasPremium) {
    return false;
  }

  const feature = await db.subscriptionFeature.findUnique({
    where: { featureKey },
  });

  return !!feature;
}

export async function createStudentSubscriptionBilling(
  studentId: string,
  planType: "premium" | "pro",
  billingPeriod: "monthly" | "annual",
  customerData?: {
    name: string;
    email: string;
    cellphone: string;
    taxId: string;
  },
) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      profile: true,
    },
  });

  if (!student) {
    throw new Error("Aluno não encontrado");
  }

  const config = getStudentPlanConfig(planType);
  if (!config) {
    throw new Error(`Plano inválido: ${planType}`);
  }

  const selectedPrice = config.prices[billingPeriod];

  const billingData: CreateBillingRequest = {
    frequency: billingPeriod === "monthly" ? "MULTIPLE_PAYMENTS" : "ONE_TIME",
    methods: ["PIX"], // Abacate Pay: apenas PIX disponível por enquanto
    products: [
      {
        externalId: `subscription-${planType}-${billingPeriod}-${studentId}`,
        name: `GymRats ${planType.charAt(0).toUpperCase() + planType.slice(1)} - ${
          billingPeriod === "monthly" ? "Mensal" : "Anual"
        }`,
        description: `Assinatura ${planType.charAt(0).toUpperCase() + planType.slice(1)} do GymRats - ${
          billingPeriod === "monthly" ? "1 mês" : "12 meses"
        } de acesso completo`,
        quantity: 1,
        price: selectedPrice,
      },
    ],
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/payments?canceled=true`,
    completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/payments?success=true`,
  };

  if (customerData) {
    const customerResponse = await abacatePay.createCustomer(customerData);
    if (customerResponse.error || !customerResponse.data) {
      throw new Error(
        customerResponse.error || "Erro ao criar cliente na AbacatePay",
      );
    }
    billingData.customerId = customerResponse.data.id;
  } else if (student.user.email) {
    billingData.customer = {
      name: student.user.name,
      email: student.user.email,
      cellphone: student.phone || "(00) 0000-0000",
      taxId: "", // Será necessário coletar CPF do usuário
    };
  }

  console.log(
    "[createStudentSubscriptionBilling] Criando billing na AbacatePay:",
    {
      studentId,
      planType,
      billingPeriod,
      billingData: {
        ...billingData,
        customer: billingData.customer
          ? { ...billingData.customer, taxId: "***" }
          : undefined,
      },
    },
  );

  const billingResponse = await abacatePay.createBilling(billingData);

  console.log("[createStudentSubscriptionBilling] Resposta da AbacatePay:", {
    hasError: !!billingResponse.error,
    error: billingResponse.error,
    hasData: !!billingResponse.data,
    dataId: billingResponse.data?.id,
    dataUrl: billingResponse.data?.url,
  });

  if (billingResponse.error || !billingResponse.data) {
    const errorMessage =
      billingResponse.error || "Erro ao criar cobrança na AbacatePay";
    console.error("[createStudentSubscriptionBilling] Erro ao criar billing:", {
      error: billingResponse.error,
      response: billingResponse,
    });
    throw new Error(errorMessage);
  }

  return billingResponse.data;
}

/**
 * Cria cobrança PIX para assinatura de estudante via pixQrCode.
 * Não cria produtos na AbacatePay - valor dinâmico.
 */
export async function createStudentSubscriptionPix(
  studentId: string,
  planType: "premium" | "pro",
  billingPeriod: "monthly" | "annual",
  subscriptionId: string,
): Promise<GymSubscriptionPixResponse | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { user: true, profile: true },
  });

  if (!student) {
    throw new Error("Aluno não encontrado");
  }

  const config = getStudentPlanConfig(planType);
  if (!config) {
    throw new Error(`Plano inválido: ${planType}`);
  }

  const selectedPrice = config.prices[billingPeriod];
  const planName = planType.charAt(0).toUpperCase() + planType.slice(1);
  const periodLabel = billingPeriod === "annual" ? "Anual" : "Mensal";
  const description = `GymRats ${planName} ${periodLabel}`.slice(0, 37);

  const pixResponse = await abacatePay.createPixQrCode({
    amount: selectedPrice,
    expiresIn: 3600, // 1 hora
    description,
    metadata: {
      studentId,
      plan: planType,
      billingPeriod,
      subscriptionId,
      kind: "student-subscription",
    },
    customer: student.user.email
      ? {
          name: student.user.name,
          email: student.user.email,
          cellphone: student.phone || "(00) 0000-0000",
          taxId: "",
        }
      : undefined,
  });

  if (pixResponse.error || !pixResponse.data) {
    console.error("[createStudentSubscriptionPix] Erro:", pixResponse.error);
    throw new Error(pixResponse.error || "Erro ao criar PIX na AbacatePay");
  }

  const pix = pixResponse.data;
  return {
    id: pix.id,
    brCode: pix.brCode,
    brCodeBase64: pix.brCodeBase64,
    amount: pix.amount,
  };
}

export async function createGymSubscriptionBilling(
  gymId: string,
  plan: "basic" | "premium" | "enterprise",
  studentCount: number,
  billingPeriod: "monthly" | "annual" = "monthly",
  customerData?: {
    name: string;
    email: string;
    cellphone: string;
    taxId: string;
  },
) {
  const gym = await db.gym.findUnique({
    where: { id: gymId },
    include: {
      user: true,
    },
  });

  if (!gym) {
    throw new Error("Academia não encontrada");
  }

  const config = getGymPlanConfig(plan);
  if (!config) {
    throw new Error(`Plano inválido: ${plan}`);
  }

  const basePrice = config.prices[billingPeriod];
  const perStudentPrice =
    billingPeriod === "annual" ? 0 : config.pricePerStudent;

  // No plano anual, o total é apenas o basePrice (sem cobrança por aluno)
  // No plano mensal, soma base + (por aluno × quantidade de alunos)
  const totalAmount =
    billingPeriod === "annual"
      ? basePrice
      : basePrice + perStudentPrice * studentCount;

  const billingData: CreateBillingRequest = {
    frequency: billingPeriod === "annual" ? "ONE_TIME" : "MULTIPLE_PAYMENTS",
    methods: ["PIX"], // Abacate Pay: apenas PIX disponível por enquanto
    products: [
      {
        externalId: `gym-subscription-${plan}-${billingPeriod}-${gymId}`,
        name: `GymRats Academia - ${
          plan.charAt(0).toUpperCase() + plan.slice(1)
        } (${billingPeriod === "annual" ? "Anual" : "Mensal"})`,
        description:
          billingPeriod === "annual"
            ? `Assinatura ${plan} anual - Preço fixo para todos os alunos - R$ ${(
                totalAmount / 100
              ).toFixed(2)}/ano`
            : `Assinatura ${plan} mensal para ${studentCount} alunos - R$ ${(
                totalAmount / 100
              ).toFixed(2)}/mês`,
        quantity: 1,
        price: totalAmount,
      },
    ],
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gym?tab=financial&subTab=subscription&canceled=true`,
    completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gym?tab=financial&subTab=subscription&success=true`,
  };

  if (customerData) {
    const customerResponse = await abacatePay.createCustomer(customerData);
    if (customerResponse.error || !customerResponse.data) {
      throw new Error(
        customerResponse.error || "Erro ao criar cliente na AbacatePay",
      );
    }
    billingData.customerId = customerResponse.data.id;
  } else if (gym.user.email) {
    billingData.customer = {
      name: gym.name,
      email: gym.email,
      cellphone: gym.phone,
      taxId: gym.cnpj || "",
    };
  }

  console.log("[createGymSubscriptionBilling] Criando billing na AbacatePay:", {
    gymId,
    plan,
    billingPeriod,
    studentCount,
    billingData: {
      ...billingData,
      customer: billingData.customer
        ? { ...billingData.customer, taxId: "***" }
        : undefined,
    },
  });

  const billingResponse = await abacatePay.createBilling(billingData);

  console.log("[createGymSubscriptionBilling] Resposta da AbacatePay:", {
    hasError: !!billingResponse.error,
    error: billingResponse.error,
    hasData: !!billingResponse.data,
    dataId: billingResponse.data?.id,
    dataUrl: billingResponse.data?.url,
  });

  if (billingResponse.error || !billingResponse.data) {
    const errorMessage =
      billingResponse.error || "Erro ao criar cobrança na AbacatePay";
    console.error("[createGymSubscriptionBilling] Erro ao criar billing:", {
      error: billingResponse.error,
      response: billingResponse,
    });
    throw new Error(errorMessage);
  }

  return billingResponse.data;
}

/**
 * Cria cobrança PIX para assinatura de academia via pixQrCode.
 * Não cria produtos na AbacatePay - valor dinâmico (base + por aluno).
 */
export async function createGymSubscriptionPix(
  gymId: string,
  plan: "basic" | "premium" | "enterprise",
  studentCount: number,
  billingPeriod: "monthly" | "annual" = "monthly",
  subscriptionId: string,
): Promise<GymSubscriptionPixResponse | null> {
  const gym = await db.gym.findUnique({
    where: { id: gymId },
    include: { user: true },
  });

  if (!gym) {
    throw new Error("Academia não encontrada");
  }

  const config =
    GYM_PLANS_CONFIG[plan.toUpperCase() as keyof typeof GYM_PLANS_CONFIG];
  if (!config) {
    throw new Error(`Plano inválido: ${plan}`);
  }

  const basePrice = config.prices[billingPeriod];
  const perStudentPrice =
    billingPeriod === "annual" ? 0 : config.pricePerStudent;

  const totalAmount =
    billingPeriod === "annual"
      ? basePrice
      : basePrice + perStudentPrice * studentCount;

  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const periodLabel = billingPeriod === "annual" ? "Anual" : "Mensal";
  const description = `GymRats ${planName} ${periodLabel}`.slice(0, 37);

  const pixResponse = await abacatePay.createPixQrCode({
    amount: totalAmount,
    expiresIn: 3600, // 1 hora
    description,
    metadata: {
      gymId,
      plan,
      billingPeriod,
      subscriptionId,
      kind: "gym-subscription",
    },
    customer: gym.email
      ? {
          name: gym.name,
          email: gym.email,
          cellphone: gym.phone || "",
          taxId: gym.cnpj || "",
        }
      : undefined,
  });

  if (pixResponse.error || !pixResponse.data) {
    console.error("[createGymSubscriptionPix] Erro:", pixResponse.error);
    throw new Error(pixResponse.error || "Erro ao criar PIX na AbacatePay");
  }

  const pix = pixResponse.data;
  return {
    id: pix.id,
    brCode: pix.brCode,
    brCodeBase64: pix.brCodeBase64,
    amount: pix.amount,
  };
}
