import {
  getGymPlanConfig,
  getPersonalPlanConfig,
  getStudentPlanConfig,
  PERSONAL_PLANS_CONFIG,
} from "@gymrats/access-control/plans-config";
import type { CreateBillingRequest } from "@gymrats/api/abacatepay";
import { abacatePay } from "@gymrats/api/abacatepay";
import { db } from "@gymrats/db";

/** Tempo de expiracao do PIX em segundos (4 minutos) */
export const PIX_EXPIRES_IN_SECONDS = 4 * 60;

/** Resposta PIX QRCode - usado para gym (valor dinamico, sem criar produtos) */
export interface GymSubscriptionPixResponse {
  id: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
  expiresAt: string;
}

export interface GymSubscriptionPricingInput {
  plan: "basic" | "premium" | "enterprise";
  billingPeriod: "monthly" | "annual";
  studentCount: number;
  personalCount: number;
}

export interface GymSubscriptionPricingResult {
  basePrice: number;
  perStudentPrice: number;
  perPersonalPrice: number;
  totalAmount: number;
}

export interface PersonalSubscriptionPricingInput {
  plan: "standard" | "pro_ai";
  billingPeriod: "monthly" | "annual";
  hasPremiumOrEnterpriseAffiliation: boolean;
}

export interface PersonalSubscriptionPricingResult {
  basePrice: number;
  discountPercent: number;
  effectivePrice: number;
}

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

export async function hasPremiumAccess(studentId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { studentId },
  });

  if (subscription && isPremiumPlan(subscription.plan)) {
    if (hasActivePremiumStatus(subscription)) {
      return true;
    }
  }

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
    throw new Error("Aluno nao encontrado");
  }

  const config = getStudentPlanConfig(planType);
  if (!config) {
    throw new Error(`Plano invalido: ${planType}`);
  }

  const selectedPrice = config.prices[billingPeriod];

  const billingData: CreateBillingRequest = {
    frequency: billingPeriod === "monthly" ? "MULTIPLE_PAYMENTS" : "ONE_TIME",
    methods: ["PIX"],
    products: [
      {
        externalId: `subscription-${planType}-${billingPeriod}-${studentId}`,
        name: `GymRats ${planType.charAt(0).toUpperCase() + planType.slice(1)} - ${
          billingPeriod === "monthly" ? "Mensal" : "Anual"
        }`,
        description: `Assinatura ${planType.charAt(0).toUpperCase() + planType.slice(1)} do GymRats - ${
          billingPeriod === "monthly" ? "1 mes" : "12 meses"
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
      taxId: "",
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
      billingResponse.error || "Erro ao criar cobranca na AbacatePay";
    console.error("[createStudentSubscriptionBilling] Erro ao criar billing:", {
      error: billingResponse.error,
      response: billingResponse,
    });
    throw new Error(errorMessage);
  }

  return billingResponse.data;
}

const REFERRAL_DISCOUNT_PERCENT = 0.05;

async function countActiveGymPersonals(gymId: string): Promise<number> {
  return db.gymPersonalAffiliation.count({
    where: { gymId, status: "active" },
  });
}

export function calculateGymSubscriptionPricing({
  plan,
  billingPeriod,
  studentCount,
  personalCount,
}: GymSubscriptionPricingInput): GymSubscriptionPricingResult {
  const config = getGymPlanConfig(plan);
  if (!config) {
    throw new Error(`Plano invalido: ${plan}`);
  }

  const basePrice = config.prices[billingPeriod];
  const perStudentPrice =
    billingPeriod === "annual" ? 0 : config.pricePerStudent;
  const perPersonalPrice =
    billingPeriod === "annual" ? 0 : (config.pricePerPersonal ?? 0);

  const totalAmount =
    billingPeriod === "annual"
      ? basePrice
      : basePrice +
        perStudentPrice * studentCount +
        perPersonalPrice * personalCount;

  return {
    basePrice,
    perStudentPrice,
    perPersonalPrice,
    totalAmount,
  };
}

export function calculatePersonalSubscriptionPricing({
  plan,
  billingPeriod,
  hasPremiumOrEnterpriseAffiliation,
}: PersonalSubscriptionPricingInput): PersonalSubscriptionPricingResult {
  const config =
    PERSONAL_PLANS_CONFIG[
      plan.toUpperCase() as keyof typeof PERSONAL_PLANS_CONFIG
    ] || getPersonalPlanConfig(plan);

  if (!config) {
    throw new Error(`Plano invalido: ${plan}`);
  }

  const basePrice = config.prices[billingPeriod];
  const discountPercent = hasPremiumOrEnterpriseAffiliation ? 50 : 0;
  const effectivePrice =
    discountPercent > 0
      ? Math.floor(basePrice * (1 - discountPercent / 100))
      : basePrice;

  return {
    basePrice,
    discountPercent,
    effectivePrice,
  };
}

export async function createStudentSubscriptionPix(
  studentId: string,
  planType: "premium" | "pro",
  billingPeriod: "monthly" | "annual",
  subscriptionId: string,
  options?: { referralCode?: string | null },
): Promise<GymSubscriptionPixResponse | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { user: true, profile: true },
  });

  if (!student) {
    throw new Error("Aluno nao encontrado");
  }

  const config = getStudentPlanConfig(planType);
  if (!config) {
    throw new Error(`Plano invalido: ${planType}`);
  }

  let selectedPrice = config.prices[billingPeriod];
  if (options?.referralCode) {
    const referrer = await db.student.findUnique({
      where: {
        referralCode: options.referralCode.startsWith("@")
          ? options.referralCode
          : `@${options.referralCode}`,
      },
    });
    if (referrer && referrer.id !== studentId) {
      selectedPrice = Math.floor(
        selectedPrice * (1 - REFERRAL_DISCOUNT_PERCENT),
      );
    }
  }
  const planName = planType.charAt(0).toUpperCase() + planType.slice(1);
  const periodLabel = billingPeriod === "annual" ? "Anual" : "Mensal";
  const description = `GymRats ${planName} ${periodLabel}`.slice(0, 37);

  const pixResponse = await abacatePay.createPixQrCode({
    amount: selectedPrice,
    expiresIn: PIX_EXPIRES_IN_SECONDS,
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
    expiresAt: pix.expiresAt,
  };
}

export async function createPersonalSubscriptionPix(
  personalId: string,
  plan: "standard" | "pro_ai",
  billingPeriod: "monthly" | "annual",
  subscriptionId: string,
): Promise<GymSubscriptionPixResponse | null> {
  const personal = await db.personal.findUnique({
    where: { id: personalId },
  });

  if (!personal) {
    throw new Error("Personal nao encontrado");
  }

  const affiliation = await db.gymPersonalAffiliation.findFirst({
    where: {
      personalId,
      status: "active",
      gym: {
        subscription: {
          status: "active",
          plan: { in: ["premium", "enterprise"] },
        },
      },
    },
    select: { id: true },
  });
  const hasDiscount = !!affiliation;

  const { effectivePrice } = calculatePersonalSubscriptionPricing({
    plan,
    billingPeriod,
    hasPremiumOrEnterpriseAffiliation: hasDiscount,
  });
  const amountCents = effectivePrice;

  const planName = plan === "pro_ai" ? "Pro AI" : "Standard";
  const periodLabel = billingPeriod === "annual" ? "Anual" : "Mensal";
  const description = `GymRats Personal ${planName} ${periodLabel}`.slice(
    0,
    37,
  );

  const pixResponse = await abacatePay.createPixQrCode({
    amount: amountCents,
    expiresIn: PIX_EXPIRES_IN_SECONDS,
    description,
    metadata: {
      personalId,
      plan,
      billingPeriod,
      subscriptionId,
      kind: "personal-subscription",
    },
    customer: personal.email
      ? {
          name: personal.name,
          email: personal.email,
          cellphone: personal.phone || "(00) 00000-0000",
          taxId: "",
        }
      : undefined,
  });

  if (pixResponse.error || !pixResponse.data) {
    console.error("[createPersonalSubscriptionPix] Erro:", pixResponse.error);
    throw new Error(pixResponse.error || "Erro ao criar PIX na AbacatePay");
  }

  const pix = pixResponse.data;
  return {
    id: pix.id,
    brCode: pix.brCode,
    brCodeBase64: pix.brCodeBase64,
    amount: pix.amount,
    expiresAt: pix.expiresAt,
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
    throw new Error("Academia nao encontrada");
  }

  const personalCount = await countActiveGymPersonals(gymId);
  const { totalAmount } = calculateGymSubscriptionPricing({
    plan,
    billingPeriod,
    studentCount,
    personalCount,
  });

  const billingData: CreateBillingRequest = {
    frequency: billingPeriod === "annual" ? "ONE_TIME" : "MULTIPLE_PAYMENTS",
    methods: ["PIX"],
    products: [
      {
        externalId: `gym-subscription-${plan}-${billingPeriod}-${gymId}`,
        name: `GymRats Academia - ${
          plan.charAt(0).toUpperCase() + plan.slice(1)
        } (${billingPeriod === "annual" ? "Anual" : "Mensal"})`,
        description:
          billingPeriod === "annual"
            ? `Assinatura ${plan} anual - Preco fixo para todos os alunos - R$ ${(
                totalAmount / 100
              ).toFixed(2)}/ano`
            : `Assinatura ${plan} mensal para ${studentCount} alunos e ${personalCount} personais - R$ ${(
                totalAmount / 100
              ).toFixed(2)}/mes`,
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
      billingResponse.error || "Erro ao criar cobranca na AbacatePay";
    console.error("[createGymSubscriptionBilling] Erro ao criar billing:", {
      error: billingResponse.error,
      response: billingResponse,
    });
    throw new Error(errorMessage);
  }

  return billingResponse.data;
}

export async function createGymSubscriptionPix(
  gymId: string,
  plan: "basic" | "premium" | "enterprise",
  studentCount: number,
  billingPeriod: "monthly" | "annual" = "monthly",
  subscriptionId: string,
  options?: { referralCode?: string | null },
): Promise<GymSubscriptionPixResponse | null> {
  const gym = await db.gym.findUnique({
    where: { id: gymId },
    include: { user: true },
  });

  if (!gym) {
    throw new Error("Academia nao encontrada");
  }

  const personalCount = await countActiveGymPersonals(gymId);
  let { totalAmount } = calculateGymSubscriptionPricing({
    plan,
    billingPeriod,
    studentCount,
    personalCount,
  });

  if (options?.referralCode) {
    const referrer = await db.student.findUnique({
      where: {
        referralCode: options.referralCode.startsWith("@")
          ? options.referralCode
          : `@${options.referralCode}`,
      },
    });
    if (referrer) {
      totalAmount = Math.floor(totalAmount * (1 - REFERRAL_DISCOUNT_PERCENT));
    }
  }

  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const periodLabel = billingPeriod === "annual" ? "Anual" : "Mensal";
  const description = `GymRats ${planName} ${periodLabel}`.slice(0, 37);

  const pixResponse = await abacatePay.createPixQrCode({
    amount: totalAmount,
    expiresIn: PIX_EXPIRES_IN_SECONDS,
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
    expiresAt: pix.expiresAt,
  };
}
