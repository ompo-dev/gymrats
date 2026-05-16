"use client";

import {
	type StudentSubscriptionData,
	useSubscriptionUnified,
} from "./use-subscription-unified";

export type SubscriptionData = StudentSubscriptionData;

interface UseSubscriptionOptions {
	includeDaysRemaining?: boolean;
	includeTrialInfo?: boolean;
}

type UseSubscriptionReturn = {
	subscription: StudentSubscriptionData | null;
	isLoading: boolean;
	error: Error | null;
	refetch: () => Promise<any>;
	startTrial: () => Promise<{ success?: boolean; error?: string }>;
	isStartingTrial: boolean;
	createSubscription: (
		plan: "monthly" | "annual",
	) => Promise<{ billingUrl?: string; error?: string }>;
	isCreatingSubscription: boolean;
	cancelSubscription: () => Promise<{ success?: boolean; error?: string }>;
	isCancelingSubscription: boolean;
};

export function useSubscription(
	options?: UseSubscriptionOptions,
): UseSubscriptionReturn {
	const result = useSubscriptionUnified({
		userType: "student",
		...options,
	});

	return {
		...result,
		subscription: result.subscription as StudentSubscriptionData | null,
		createSubscription: result.createSubscription as (
			plan: "monthly" | "annual",
		) => Promise<{ billingUrl?: string; error?: string }>,
	};
}
