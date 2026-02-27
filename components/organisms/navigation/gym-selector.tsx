"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DuoSelect, type DuoSelectOption } from "@/components/duo";
import { useGymsList } from "@/hooks/use-gyms-list";

function GymSelectorSimple() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const {
		gyms,
		activeGymId,
		setActiveGymId,
		canCreateMultipleGyms,
		isLoading,
	} = useGymsList();

	const [mounted, setMounted] = useState(false);

	// Evitar hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	const handleSelectGym = async (gymId: string) => {
		if (gymId === "create-new") {
			router.push("/gym/onboarding?mode=new");
			return;
		}
		// 1. Limpar stores e cache para evitar dados da academia anterior
		const { useGymUnifiedStore } = await import("@/stores/gym-unified-store");
		const { useSubscriptionStore } = await import("@/stores/subscription-store");
		useGymUnifiedStore.getState().resetForGymChange();
		useSubscriptionStore.getState().resetForGymChange();
		// Invalidar cache React Query (subscription, etc.)
		queryClient.invalidateQueries({ queryKey: ["gym-subscription"] });
		// 2. Atualizar academia ativa
		await setActiveGymId(gymId);
		// 3. Refetch dados da página para a nova academia
		router.refresh();
	};

	// Preparar opções para o DuoSelect
	const selectOptions: DuoSelectOption[] = [
		...gyms.map((gym) => ({
			value: gym.id,
			label: gym.name,
			description: `${
				gym.plan === "basic"
					? "Básico"
					: gym.plan === "premium"
						? "Premium"
						: "Empresarial"
			}${!gym.hasActiveSubscription ? " • Trial" : ""}`,
			icon: gym.logo ? (
				<img
					src={gym.logo}
					alt=""
					className="h-8 w-8 shrink-0 rounded-full object-cover"
				/>
			) : (
				<Building2 className="h-5 w-5 shrink-0 text-duo-fg" />
			),
			badge: !gym.hasActiveSubscription ? (
				<span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-medium">
					Trial
				</span>
			) : undefined,
		})),
		...(canCreateMultipleGyms
			? [
					{
						value: "create-new",
						label: "Nova Academia",
						description: "Criar uma nova unidade",
						icon: <Plus className="w-5 h-5 text-duo-green" />,
					},
				]
			: []),
	];

	// Renderizar skeleton até montar no cliente (evitar hydration mismatch)
	if (!mounted || isLoading || gyms.length === 0) {
		return (
			<div
				className="h-[50px] w-fit min-w-[180px] rounded-2xl bg-gray-50 border-2 border-gray-200 dark:bg-duo-bg-elevated dark:border-duo-border"
				suppressHydrationWarning
			/>
		);
	}

	return (
		<DuoSelect.Simple
			options={selectOptions}
			value={activeGymId || undefined}
			onChange={handleSelectGym}
			placeholder="Selecione uma academia"
			className="w-fit min-w-[180px]"
		/>
	);
}

export const GymSelector = { Simple: GymSelectorSimple };
