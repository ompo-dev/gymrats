"use client";

import { Gift } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";

interface TrialOfferProps {
  title: string;
  description: string;
  buttonText: string;
  isLoading: boolean;
  onStartTrial: () => Promise<void>;
}

function TrialOfferSimple({
  title,
  description,
  buttonText,
  isLoading,
  onStartTrial,
}: TrialOfferProps) {
  return (
    <DuoCard.Root variant="blue" size="default" className="text-center">
      <Gift className="mx-auto mb-4 h-16 w-16 text-duo-blue" />
      <h2 className="mb-2 text-2xl font-bold text-duo-text">{title}</h2>
      <p className="mb-6 text-sm text-duo-gray-dark">{description}</p>
      <DuoButton
        onClick={onStartTrial}
        disabled={isLoading}
        variant="primary"
        className="w-full"
        size="lg"
      >
        {isLoading ? "Iniciando..." : buttonText}
      </DuoButton>
      {isLoading && (
        <p className="mt-2 text-xs text-duo-gray-dark">
          Aguarde, estamos configurando seu trial...
        </p>
      )}
    </DuoCard.Root>
  );
}

export const TrialOffer = { Simple: TrialOfferSimple };
