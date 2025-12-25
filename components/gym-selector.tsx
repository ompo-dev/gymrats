"use client";

import { useGymsList } from "@/hooks/use-gyms-list";
import { Select, SelectOption } from "@/components/ui/select";
import { Plus, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function GymSelector() {
  const router = useRouter();
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
      // Redirecionar para o onboarding em modo "criar nova"
      router.push("/gym/onboarding?mode=new");
      return;
    }
    await setActiveGymId(gymId);
  };

  // Preparar opções para o Select
  const selectOptions: SelectOption[] = [
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
      icon: <Building2 className="w-5 h-5 text-gray-600" />,
      badge: !gym.hasActiveSubscription ? (
        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
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
        className="min-w-[280px] h-[50px] rounded-2xl bg-gray-50 border-2 border-gray-200"
        suppressHydrationWarning
      />
    );
  }

  return (
    <Select
      options={selectOptions}
      value={activeGymId || undefined}
      onChange={handleSelectGym}
      variant="default"
      size="default"
      placeholder="Selecione uma academia"
    />
  );
}
