"use client";

import { Gift } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";

interface SubscriptionTrialCardProps {
  onStartTrial: () => Promise<void>;
  isLoading: boolean;
}

export function SubscriptionTrialCard({
  onStartTrial,
  isLoading,
}: SubscriptionTrialCardProps) {
  return (
    <DuoCard.Root variant="blue" size="default" className="text-center">
      <Gift className="mx-auto mb-4 h-16 w-16 text-duo-blue" />
      <h2 className="mb-2 text-2xl font-bold text-duo-text">
        Experimente 14 dias gratis!
      </h2>
      <p className="mb-6 text-sm text-duo-gray-dark">
        Teste todas as funcionalidades sem compromisso e conheca a cobranca
        mensal com base do plano, adicional por aluno e por personal filiado.
      </p>
      <DuoButton
        onClick={onStartTrial}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Iniciando..." : "Iniciar Trial Gratis"}
      </DuoButton>
    </DuoCard.Root>
  );
}
