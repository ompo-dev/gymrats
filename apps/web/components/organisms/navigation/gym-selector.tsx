"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DuoSelect, type DuoSelectOption } from "@/components/duo";
import { invalidateQueryDomains } from "@/hooks/use-bootstrap-refresh";
import { useGymsList } from "@/hooks/use-gyms-list";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [isSwitching, setIsSwitching] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { toast } = useToast();

  const subscriptionTabUrl = "/gym?tab=financial&subTab=subscription";

  const handleSelectGym = async (gymId: string) => {
    if (gymId === "create-new") {
      if (!canCreateMultipleGyms) {
        toast({
          title: "Limite de Unidades Atingido",
          description:
            "Seu plano atual não permite mais de uma academia. Faça upgrade para Premium para expandir sua rede!",
          variant: "default",
        });
        router.push(subscriptionTabUrl);
        return;
      }
      router.push("/gym/onboarding?mode=new");
      return;
    }
    // Bloquear troca para academia inativa — redirecionar para aba de assinatura
    const gym = gyms.find((g) => g.id === gymId);
    if (gym && !gym.isActive) {
      toast({
        title: "Unidade Inativa",
        description:
          "Faça upgrade para Premium ou Enterprise para reativar esta unidade.",
        variant: "default",
      });
      router.push(subscriptionTabUrl);
      return;
    }

    if (gymId === activeGymId) return;

    try {
      setIsSwitching(true);
      // 1. Limpar stores e cache para evitar dados da academia anterior
      const { useGymUnifiedStore } = await import("@/stores/gym-unified-store");
      const { useSubscriptionStore } = await import(
        "@/stores/subscription-store"
      );
      useGymUnifiedStore.getState().resetForGymChange();
      useSubscriptionStore.getState().resetForGymChange();
      // 2. Atualizar academia ativa (aguarda backend)
      await setActiveGymId(gymId);
      // 3. Invalidar apenas domínios afetados pela troca de unidade
      await invalidateQueryDomains(queryClient, ["gym", "payments"]);
      router.refresh();
    } finally {
      setIsSwitching(false);
    }
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
      }${!gym.isActive ? " • Inativa" : !gym.hasActiveSubscription ? " • Trial" : ""}`,
      className: !gym.isActive ? "opacity-60 grayscale-[0.5]" : "",
      icon: gym.logo ? (
        <img
          src={gym.logo}
          alt=""
          className={cn(
            "h-8 w-8 shrink-0 rounded-full object-cover",
            !gym.isActive && "grayscale",
          )}
        />
      ) : (
        <Building2
          className={cn(
            "h-5 w-5 shrink-0",
            !gym.isActive ? "text-duo-gray" : "text-duo-fg",
          )}
        />
      ),
      badge: !gym.isActive ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-bold uppercase tracking-wider border border-gray-200">
          Inativa
        </span>
      ) : !gym.hasActiveSubscription ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 font-bold uppercase tracking-wider border border-orange-200">
          Trial
        </span>
      ) : undefined,
    })),
    // Sempre mostrar opção de nova academia se for admin/gym owner
    // Se não puder criar mais, mostramos como "Locked" ou com aviso
    {
      value: "create-new",
      label: canCreateMultipleGyms ? "Nova Academia" : "Adicionar Unidade",
      description: canCreateMultipleGyms
        ? "Criar uma nova unidade"
        : "Upgrade necessário para +1 unidade",
      icon: (
        <Plus
          className={cn(
            "w-5 h-5",
            canCreateMultipleGyms ? "text-duo-green" : "text-duo-gray-dark",
          )}
        />
      ),
      badge: !canCreateMultipleGyms ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-duo-purple/10 text-duo-purple font-bold uppercase border border-duo-purple/20">
          Upgrade
        </span>
      ) : undefined,
    },
  ];

  // Renderizar skeleton até montar no cliente (evitar hydration mismatch)
  if (!mounted || isLoading || isSwitching || gyms.length === 0) {
    return (
      <div
        className="h-[50px] w-fit min-w-[180px] rounded-2xl bg-gray-50 border-2 border-gray-200 dark:bg-duo-bg-elevated dark:border-duo-border animate-pulse"
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
