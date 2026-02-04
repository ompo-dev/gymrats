"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { useSubscriptionStore } from "@/stores/subscription-store";

// Tipo unificado para subscription de student
export interface StudentSubscriptionData {
	id: string;
	plan: string;
	status: string;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
	canceledAt: Date | null;
	trialStart: Date | null;
	trialEnd: Date | null;
	isTrial: boolean;
	daysRemaining: number | null;
	billingPeriod?: "monthly" | "annual"; // Período de cobrança atual
}

// Tipo unificado para subscription de gym
export interface GymSubscriptionData {
	id: string;
	plan: string;
	status: string;
	basePrice: number;
	pricePerStudent: number;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
	canceledAt: Date | null;
	trialStart: Date | null;
	trialEnd: Date | null;
	isTrial: boolean;
	daysRemaining: number | null;
	activeStudents: number;
	totalAmount: number;
	billingPeriod?: "monthly" | "annual"; // Período de cobrança atual
}

// Tipo unificado
export type SubscriptionData = StudentSubscriptionData | GymSubscriptionData;

interface UseSubscriptionOptions {
	userType: "student" | "gym";
	includeDaysRemaining?: boolean;
	includeTrialInfo?: boolean;
	includeActiveStudents?: boolean;
}

export function useSubscriptionUnified(options: UseSubscriptionOptions) {
	const queryClient = useQueryClient();
	const store = useSubscriptionStore();
	const { setSubscription, setGymSubscription } = store;
	const { userType } = options;

	const queryKey = userType === "student" ? "subscription" : "gym-subscription";
	const currentEndpoint =
		userType === "student"
			? "/api/subscriptions/current"
			: "/api/gym-subscriptions/current";
	const startTrialEndpoint =
		userType === "student"
			? "/api/subscriptions/start-trial"
			: "/api/gym-subscriptions/start-trial";
	const createEndpoint =
		userType === "student"
			? "/api/subscriptions/create"
			: "/api/gym-subscriptions/create";
	const cancelEndpoint =
		userType === "student"
			? "/api/subscriptions/cancel"
			: "/api/gym-subscriptions/cancel";

	const { data, isLoading, error, refetch } = useQuery<SubscriptionData | null>(
		{
			queryKey: [queryKey],
			queryFn: async () => {
				try {
					const response = await apiClient.get<{
						subscription: SubscriptionData | null;
					}>(currentEndpoint);
					const sub = response.data.subscription;

					// Log detalhado para debug - verificar se billingPeriod está presente
					const billingPeriodValue = (sub as any)?.billingPeriod;
					const allKeys = sub ? Object.keys(sub) : [];

					console.log(`[${userType}] API Response:`, {
						hasSubscription: !!sub,
						subscriptionId: sub?.id,
						subscriptionStatus: sub?.status,
						subscriptionPlan: sub?.plan,
						billingPeriod: billingPeriodValue,
						billingPeriodType: typeof billingPeriodValue,
						allKeys: allKeys,
						hasBillingPeriodKey: allKeys.includes("billingPeriod"),
					});

					// Log completo do objeto para debug
					if (sub) {
						console.log(
							`[${userType}] Full subscription object:`,
							JSON.parse(JSON.stringify(sub)),
						);
						console.log(
							`[${userType}] BillingPeriod direto:`,
							(sub as any).billingPeriod,
						);
					}

					if (!sub) {
						return null;
					}

					// Extrair billingPeriod antes de criar baseData
					const billingPeriodFromAPI = (sub as any)?.billingPeriod || "monthly";

					// Converter strings de data para Date objects
					const baseData = {
						...sub,
						currentPeriodStart: new Date(sub.currentPeriodStart),
						currentPeriodEnd: new Date(sub.currentPeriodEnd),
						trialStart: sub.trialStart ? new Date(sub.trialStart) : null,
						trialEnd: sub.trialEnd ? new Date(sub.trialEnd) : null,
						canceledAt: sub.canceledAt ? new Date(sub.canceledAt) : null,
						isTrial: sub.trialEnd ? new Date(sub.trialEnd) > new Date() : false,
						daysRemaining: sub.trialEnd
							? Math.max(
									0,
									Math.ceil(
										(new Date(sub.trialEnd).getTime() - Date.now()) /
											(1000 * 60 * 60 * 24),
									),
								)
							: null,
					};

					// Adicionar campos específicos de gym se necessário
					if (userType === "gym" && "activeStudents" in sub) {
						const gymData = {
							...baseData,
							activeStudents: (sub as GymSubscriptionData).activeStudents || 0,
							totalAmount: (sub as GymSubscriptionData).totalAmount || 0,
							billingPeriod: billingPeriodFromAPI as "monthly" | "annual", // Garantir que billingPeriod seja preservado
						};

						console.log(`[${userType}] Gym subscription data preparada:`, {
							billingPeriod: gymData.billingPeriod,
							plan: gymData.plan,
						});

						return gymData as GymSubscriptionData;
					}

					const result = baseData as StudentSubscriptionData;
					return result;
				} catch (error) {
					console.error(`[${userType}] Erro ao buscar subscription:`, error);
					return null;
				}
			},
			staleTime: 1000 * 60, // 1 minuto (aumentado para evitar refetches desnecessários)
			retry: 2,
			refetchOnMount: false, // Desabilitado para evitar loops - dados vêm do store unificado
			refetchOnWindowFocus: false,
			refetchOnReconnect: false, // Desabilitado para evitar loops
			gcTime: 1000 * 60 * 5, // 5 minutos
		},
	);

	// Sincronizar com store quando data mudar
	useEffect(() => {
		if (data !== undefined) {
			if (data === null) {
				const storeState = useSubscriptionStore.getState();
				if (userType === "student") {
					const currentStore = storeState.subscription;
					if (currentStore && currentStore.id === "temp-trial-id") {
						return;
					}
					setSubscription(null);
				} else {
					const currentStore = storeState.gymSubscription;
					if (currentStore && currentStore.id === "temp-trial-id") {
						return;
					}
					setGymSubscription(null);
				}
			} else {
				if (userType === "student") {
					setSubscription(data as StudentSubscriptionData);
				} else {
					setGymSubscription(data as GymSubscriptionData);
				}
			}
		}
	}, [data, userType, setSubscription, setGymSubscription]);

	const startTrialMutation = useMutation({
		mutationFn: async () => {
			try {
				const response = await apiClient.post<{
					success?: boolean;
					error?: string;
				}>(startTrialEndpoint);
				return response.data;
			} catch (error: any) {
				const errorMessage =
					error.response?.data?.error ||
					error.message ||
					"Erro ao iniciar trial";
				return { error: errorMessage };
			}
		},
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: [queryKey] });

			const previousSubscription =
				queryClient.getQueryData<SubscriptionData | null>([queryKey]);

			const now = new Date();
			const trialEnd = new Date(now);
			trialEnd.setDate(trialEnd.getDate() + 14);

			const optimisticSubscription: SubscriptionData =
				userType === "student"
					? ({
							id: "temp-trial-id",
							plan: "premium",
							status: "trialing",
							currentPeriodStart: now,
							currentPeriodEnd: trialEnd,
							cancelAtPeriodEnd: false,
							canceledAt: null,
							trialStart: now,
							trialEnd: trialEnd,
							isTrial: true,
							daysRemaining: 14,
						} as StudentSubscriptionData)
					: ({
							id: "temp-trial-id",
							plan: "basic",
							status: "trialing",
							basePrice: 150,
							pricePerStudent: 1.5,
							currentPeriodStart: now,
							currentPeriodEnd: trialEnd,
							cancelAtPeriodEnd: false,
							canceledAt: null,
							trialStart: now,
							trialEnd: trialEnd,
							isTrial: true,
							daysRemaining: 14,
							activeStudents: 0,
							totalAmount: 150,
						} as GymSubscriptionData);

			if (userType === "student") {
				setSubscription(optimisticSubscription as StudentSubscriptionData);
			} else {
				setGymSubscription(optimisticSubscription as GymSubscriptionData);
			}

			queryClient.setQueryData<SubscriptionData | null>(
				[queryKey],
				optimisticSubscription,
			);

			return { previousSubscription };
		},
		onError: async (err: any, _variables, context) => {
			const errorMessage =
				err.response?.data?.error || err.message || "Erro ao iniciar trial";

			if (context?.previousSubscription !== undefined) {
				if (userType === "student") {
					setSubscription(
						context.previousSubscription as StudentSubscriptionData | null,
					);
				} else {
					setGymSubscription(
						context.previousSubscription as GymSubscriptionData | null,
					);
				}
				queryClient.setQueryData<SubscriptionData | null>(
					[queryKey],
					context.previousSubscription,
				);
			}

			if (errorMessage.includes("já existe")) {
				await queryClient.invalidateQueries({
					queryKey: [queryKey],
				});
				await queryClient.refetchQueries({
					queryKey: [queryKey],
				});
			}
		},
		onSuccess: async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));

			await queryClient.invalidateQueries({
				queryKey: [queryKey],
			});

			const _refetchedData = await queryClient.refetchQueries({
				queryKey: [queryKey],
			});

			const cachedData = queryClient.getQueryData<SubscriptionData | null>([
				queryKey,
			]);

			if (
				cachedData !== null &&
				cachedData !== undefined &&
				cachedData.id !== "temp-trial-id"
			) {
				if (userType === "student") {
					setSubscription(cachedData as StudentSubscriptionData);
				} else {
					setGymSubscription(cachedData as GymSubscriptionData);
				}
			}
		},
	});

	const createSubscriptionMutation = useMutation({
		mutationFn: async (
			params:
				| { plan: "monthly" | "annual" }
				| {
						plan: "basic" | "premium" | "enterprise";
						billingPeriod: "monthly" | "annual";
				  },
		) => {
			const response = await apiClient.post<{
				billingUrl?: string;
				error?: string;
			}>(createEndpoint, params);
			return response.data;
		},
	});

	const cancelSubscriptionMutation = useMutation({
		mutationFn: async () => {
			const response = await apiClient.post<{
				success?: boolean;
				error?: string;
			}>(cancelEndpoint);
			return response.data;
		},
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: [queryKey] });

			const previousSubscription =
				queryClient.getQueryData<SubscriptionData | null>([queryKey]);

			// Atualizar status para canceled mantendo os dados
			if (previousSubscription) {
				const canceledSubscription = {
					...previousSubscription,
					status: "canceled" as const,
					canceledAt: new Date(),
					cancelAtPeriodEnd: false,
				};

				if (userType === "student") {
					setSubscription(canceledSubscription as StudentSubscriptionData);
				} else {
					setGymSubscription(canceledSubscription as GymSubscriptionData);
				}

				queryClient.setQueryData<SubscriptionData | null>(
					[queryKey],
					canceledSubscription,
				);
			} else {
				if (userType === "student") {
					setSubscription(null);
				} else {
					setGymSubscription(null);
				}
				queryClient.setQueryData<SubscriptionData | null>([queryKey], null);
			}

			return { previousSubscription };
		},
		onError: (_err, _variables, context) => {
			if (context?.previousSubscription) {
				if (userType === "student") {
					setSubscription(
						context.previousSubscription as StudentSubscriptionData | null,
					);
				} else {
					setGymSubscription(
						context.previousSubscription as GymSubscriptionData | null,
					);
				}
				queryClient.setQueryData<SubscriptionData | null>(
					[queryKey],
					context.previousSubscription,
				);
			}
		},
		onSuccess: async () => {
			// Aguardar um pouco para garantir que o servidor processou
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Invalidar e refetch para pegar os dados atualizados do servidor
			await queryClient.invalidateQueries({
				queryKey: [queryKey],
			});

			const _refetchedData = await queryClient.refetchQueries({
				queryKey: [queryKey],
			});

			// Sincronizar com store após refetch
			const updatedData = queryClient.getQueryData<SubscriptionData | null>([
				queryKey,
			]);
			if (updatedData !== undefined) {
				if (userType === "student") {
					setSubscription(updatedData as StudentSubscriptionData | null);
				} else {
					setGymSubscription(updatedData as GymSubscriptionData | null);
				}
			}
		},
	});

	// Criar funções tipadas separadamente para evitar problemas de inferência
	const createSubscriptionStudent = async (plan: "monthly" | "annual") => {
		return await createSubscriptionMutation.mutateAsync({ plan });
	};

	const createSubscriptionGym = async (
		plan: "basic" | "premium" | "enterprise",
		billingPeriod: "monthly" | "annual" = "monthly",
	) => {
		return await createSubscriptionMutation.mutateAsync({
			plan,
			billingPeriod,
		});
	};

	const createSubscription =
		userType === "student" ? createSubscriptionStudent : createSubscriptionGym;

	return {
		subscription: data,
		isLoading,
		error,
		refetch,
		startTrial: startTrialMutation.mutateAsync,
		isStartingTrial: startTrialMutation.isPending,
		createSubscription: createSubscription as
			| typeof createSubscriptionStudent
			| typeof createSubscriptionGym,
		isCreatingSubscription: createSubscriptionMutation.isPending,
		cancelSubscription: cancelSubscriptionMutation.mutateAsync,
		isCancelingSubscription: cancelSubscriptionMutation.isPending,
	};
}
