import { create } from "zustand";
import type { SubscriptionPlan } from "@/components/organisms/sections/subscription-section";

interface SubscriptionUIState {
	// Estado da seleção de planos
	selectedPlan: string;
	selectedBillingPeriod: "monthly" | "annual";
	showPaymentModal: boolean;
	isProcessingPayment: boolean;

	// Ações
	setSelectedPlan: (planId: string) => void;
	setSelectedBillingPeriod: (period: "monthly" | "annual") => void;
	setShowPaymentModal: (show: boolean) => void;
	setIsProcessingPayment: (processing: boolean) => void;
	initializeFromSubscription: (
		plans: SubscriptionPlan[],
		currentPlan?: string,
		currentBillingPeriod?: "monthly" | "annual",
		userType?: "student" | "gym",
	) => void;
	reset: () => void;
}

const defaultState = {
	selectedPlan: "",
	selectedBillingPeriod: "monthly" as const,
	showPaymentModal: false,
	isProcessingPayment: false,
};

export const useSubscriptionUIStore = create<SubscriptionUIState>((set) => ({
	...defaultState,

	setSelectedPlan: (planId) => set({ selectedPlan: planId }),

	setSelectedBillingPeriod: (period) => set({ selectedBillingPeriod: period }),

	setShowPaymentModal: (show) => set({ showPaymentModal: show }),

	setIsProcessingPayment: (processing) =>
		set({ isProcessingPayment: processing }),

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
				// Enterprise: selecionar Basic (downgrade)
				defaultPlanId = "basic";
			} else if (currentPlanIndex === 1) {
				// Premium: selecionar Basic (downgrade)
				defaultPlanId = "basic";
			} else if (currentPlanIndex === 0) {
				// Basic: selecionar Premium (upgrade)
				defaultPlanId = "premium";
			} else {
				// Fallback: premium ou primeiro disponível
				defaultPlanId =
					plans.find((p) => p.id === "premium")?.id || plans[0]?.id || "";
			}
		} else {
			// Sem subscription ou outros casos: usar premium ou primeiro disponível
			const defaultPlan = plans.find((p) => p.id === "premium") || plans[0];
			defaultPlanId = defaultPlan?.id || "";
		}

		set({
			selectedPlan: defaultPlanId,
			selectedBillingPeriod: defaultBillingPeriod,
		});
	},

	reset: () => set(defaultState),
}));
