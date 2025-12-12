import { db } from "@/lib/db";
import { abacatePay } from "@/lib/api/abacatepay";
import type { CreateBillingRequest } from "@/lib/api/abacatepay";
import { addMonths } from "date-fns";

export async function hasPremiumAccess(studentId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { studentId },
  });

  // Verificar se tem trial ativo ou premium ativo
  if (subscription?.plan === "premium") {
    const now = new Date();
    const isTrialActive =
      subscription.trialEnd && new Date(subscription.trialEnd) > now;
    const isActive = subscription.status === "active";
    const isTrialing = subscription.status === "trialing";

    if (isActive || isTrialing || isTrialActive) {
      return true;
    }
  }

  const membership = await db.gymMembership.findFirst({
    where: {
      studentId,
      status: "active",
    },
    include: {
      gym: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (membership?.gym?.subscription) {
    const gymSub = membership.gym.subscription;
    const now = new Date();
    const isTrialActive = gymSub.trialEnd && new Date(gymSub.trialEnd) > now;
    const isActive = gymSub.status === "active";
    const isTrialing = gymSub.status === "trialing";

    if (isActive || isTrialing || isTrialActive) {
      return true;
    }
  }

  return false;
}

export async function canUseFeature(
  studentId: string,
  featureKey: string
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
  plan: "monthly" | "annual",
  customerData?: {
    name: string;
    email: string;
    cellphone: string;
    taxId: string;
  }
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

  const prices = {
    monthly: 1500, // R$ 15,00 em centavos
    annual: 15000, // R$ 150,00 em centavos
  };

  const billingData: CreateBillingRequest = {
    frequency: plan === "monthly" ? "MULTIPLE_PAYMENTS" : "ONE_TIME",
    methods: ["PIX", "CARD"],
    products: [
      {
        externalId: `subscription-${plan}-${studentId}`,
        name: `GymRats Premium - ${plan === "monthly" ? "Mensal" : "Anual"}`,
        description: `Assinatura Premium do GymRats - ${
          plan === "monthly" ? "1 mês" : "12 meses"
        } de acesso completo`,
        quantity: 1,
        price: prices[plan],
      },
    ],
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/payments?canceled=true`,
    completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/payments?success=true`,
  };

  if (customerData) {
    const customerResponse = await abacatePay.createCustomer(customerData);
    if (customerResponse.error || !customerResponse.data) {
      throw new Error(
        customerResponse.error || "Erro ao criar cliente na AbacatePay"
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

  const billingResponse = await abacatePay.createBilling(billingData);

  if (billingResponse.error || !billingResponse.data) {
    throw new Error(
      billingResponse.error || "Erro ao criar cobrança na AbacatePay"
    );
  }

  return billingResponse.data;
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
  }
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

  const prices = {
    basic: {
      base: 15000, // R$ 150,00
      perStudent: 150, // R$ 1,50
    },
    premium: {
      base: 25000, // R$ 250,00
      perStudent: 100, // R$ 1,00
    },
    enterprise: {
      base: 40000, // R$ 400,00
      perStudent: 50, // R$ 0,50
    },
  };

  const planPrices = prices[plan];

  // Calcular preço com desconto anual diferenciado por plano
  // Basic: 5% desconto, Premium: 10% desconto, Enterprise: 15% desconto
  let basePrice = planPrices.base;
  let perStudentPrice = planPrices.perStudent;

  if (billingPeriod === "annual") {
    // Plano anual: preço fixo, sem cobrança por aluno
    // Aplicar desconto diferenciado no valor anual da base apenas
    const annualDiscounts = {
      basic: 0.95, // 5% desconto
      premium: 0.9, // 10% desconto
      enterprise: 0.85, // 15% desconto
    };
    basePrice = Math.round(planPrices.base * 12 * annualDiscounts[plan]);
    perStudentPrice = 0; // No plano anual, não há cobrança por aluno
  } else {
    // Mensal: manter valores originais
    basePrice = planPrices.base;
    perStudentPrice = planPrices.perStudent;
  }

  // No plano anual, o total é apenas o basePrice (sem cobrança por aluno)
  // No plano mensal, soma base + (por aluno × quantidade de alunos)
  const totalAmount =
    billingPeriod === "annual"
      ? basePrice
      : basePrice + perStudentPrice * studentCount;

  const billingData: CreateBillingRequest = {
    frequency: billingPeriod === "annual" ? "ONE_TIME" : "MULTIPLE_PAYMENTS",
    methods: ["PIX", "CARD"],
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
        customerResponse.error || "Erro ao criar cliente na AbacatePay"
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

  const billingResponse = await abacatePay.createBilling(billingData);

  if (billingResponse.error || !billingResponse.data) {
    throw new Error(
      billingResponse.error || "Erro ao criar cobrança na AbacatePay"
    );
  }

  return billingResponse.data;
}
