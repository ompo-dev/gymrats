import { create } from "zustand";
import type { SubscriptionPlan } from "@/components/organisms/sections/subscription-section";

interface SubscriptionUIState {
  // Estado da seleção de planos
  selectedPlan: string;
  selectedBillingPeriod: "monthly" | "annual";
  isProcessingPayment: boolean;

  // Ações
  setSelectedPlan: (planId: string) => void;
  setSelectedBillingPeriod: (period: "monthly" | "annual") => void;
  setIsProcessingPayment: (processing: boolean) => void;
  initializeFromSubscription: (
    plans: SubscriptionPlan[],
    currentPlan?: string,
    currentBillingPeriod?: "monthly" | "annual",
    userType?: "student" | "gym" | "personal",
  ) => void;
  reset: () => void;
}

const defaultState = {
  selectedPlan: "",
  selectedBillingPeriod: "monthly" as const,
  isProcessingPayment: false,
};

export const useSubscriptionUIStore = create<SubscriptionUIState>((set) => ({
  ...defaultState,

  setSelectedPlan: (planId) =>
    set((state) =>
      state.selectedPlan === planId ? state : { selectedPlan: planId },
    ),

  setSelectedBillingPeriod: (period) =>
    set((state) =>
      state.selectedBillingPeriod === period
        ? state
        : { selectedBillingPeriod: period },
    ),

  setIsProcessingPayment: (processing) =>
    set((state) =>
      state.isProcessingPayment === processing
        ? state
        : { isProcessingPayment: processing },
    ),

  initializeFromSubscription: (
    plans,
    currentPlan,
    currentBillingPeriod,
    userType,
  ) => {
    // Determinar o billing period padrão
    let defaultBillingPeriod: "monthly" | "annual" = "monthly";
    let defaultPlanId = "";

    if (
      userType === "student" &&
      currentPlan &&
      currentBillingPeriod === "monthly"
    ) {
      // Para student no mensal, mostrar anual como opção
      defaultBillingPeriod = "annual";
      defaultPlanId = "premium";
    } else if (userType === "gym" && currentPlan && currentBillingPeriod) {
      // Para gym: manter o período atual e selecionar um plano diferente do atual
      defaultBillingPeriod = currentBillingPeriod;

      // Selecionar um plano diferente do atual para upgrade/downgrade
      const planHierarchy = ["basic", "premium", "enterprise"];
      const currentPlanIndex = planHierarchy.indexOf(currentPlan.toLowerCase());

      if (currentPlanIndex === 2) {
        defaultPlanId = "basic";
      } else if (currentPlanIndex === 1) {
        defaultPlanId = "basic";
      } else if (currentPlanIndex === 0) {
        defaultPlanId = "premium";
      } else {
        defaultPlanId =
          plans.find((p) => p.id === "premium")?.id || plans[0]?.id || "";
      }
    } else if (userType === "personal" && currentPlan && currentBillingPeriod) {
      defaultBillingPeriod = currentBillingPeriod;
      const planHierarchy = ["standard", "pro_ai"];
      const currentPlanIndex = planHierarchy.indexOf(
        currentPlan.toLowerCase().replace(/\s+/g, "_"),
      );
      if (currentPlanIndex === 1) {
        defaultPlanId = "standard";
      } else {
        defaultPlanId =
          plans.find((p) => p.id === "pro_ai")?.id || plans[0]?.id || "";
      }
    } else {
      // Sem subscription ou outros casos
      const defaultPlan =
        userType === "personal"
          ? plans.find((p) => p.id === "standard") || plans[0]
          : plans.find((p) => p.id === "premium") || plans[0];
      defaultPlanId = defaultPlan?.id || "";
    }

    set((state) => {
      if (
        state.selectedPlan === defaultPlanId &&
        state.selectedBillingPeriod === defaultBillingPeriod
      ) {
        return state;
      }

      return {
        selectedPlan: defaultPlanId,
        selectedBillingPeriod: defaultBillingPeriod,
      };
    });
  },

  reset: () => set(defaultState),
}));
