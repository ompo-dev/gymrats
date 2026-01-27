"use client";

import { Gift } from "lucide-react";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { Button } from "@/components/atoms/buttons/button";

interface TrialOfferProps {
  title: string;
  description: string;
  buttonText: string;
  isLoading: boolean;
  onStartTrial: () => Promise<void>;
}

export function TrialOffer({
  title,
  description,
  buttonText,
  isLoading,
  onStartTrial,
}: TrialOfferProps) {
  return (
    <DuoCard variant="blue" size="default" className="text-center">
      <Gift className="mx-auto mb-4 h-16 w-16 text-duo-blue" />
      <h2 className="mb-2 text-2xl font-bold text-duo-text">{title}</h2>
      <p className="mb-6 text-sm text-duo-gray-dark">{description}</p>
      <Button
        onClick={onStartTrial}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "Iniciando..." : buttonText}
      </Button>
      {isLoading && (
        <p className="mt-2 text-xs text-duo-gray-dark">
          Aguarde, estamos configurando seu trial...
        </p>
      )}
    </DuoCard>
  );
}
