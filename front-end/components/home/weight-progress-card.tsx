"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { cn } from "@/lib/utils";

interface WeightProgressCardProps {
  currentWeight: number | null;
  weightGain: number | null;
  hasWeightLossGoal?: boolean;
  weightHistory: Array<{ date: Date | string; weight: number }>;
}

export function WeightProgressCard({
  currentWeight,
  weightGain,
  hasWeightLossGoal = false,
  weightHistory,
}: WeightProgressCardProps) {
  if (!currentWeight) {
    return null;
  }

  const isPositive = hasWeightLossGoal
    ? weightGain !== null && weightGain < 0
    : weightGain !== null && weightGain > 0;

  const isNeutral = weightGain === null || weightGain === 0;

  const getWeightIcon = () => {
    if (isNeutral) return Minus;
    return isPositive ? TrendingDown : TrendingUp;
  };

  const getWeightColor = () => {
    if (isNeutral) return "text-duo-gray-dark";
    return isPositive ? "text-duo-green" : "text-duo-red";
  };

  const WeightIcon = getWeightIcon();

  // Pegar últimos 7 pontos para mostrar tendência
  const recentWeights = weightHistory.slice(0, 7).reverse();
  const maxWeight = Math.max(...recentWeights.map((w) => w.weight));
  const minWeight = Math.min(...recentWeights.map((w) => w.weight));
  const range = maxWeight - minWeight || 1;

  return (
    <SectionCard
      icon={TrendingUp}
      title="Evolução de Peso"
      className="space-y-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-duo-text">
              {currentWeight.toFixed(1)} kg
            </div>
            <div className="text-xs text-duo-gray-dark">Peso atual</div>
          </div>
          {weightGain !== null && (
            <div className={cn("flex items-center gap-1", getWeightColor())}>
              <WeightIcon className="h-5 w-5" />
              <div className="text-lg font-bold">
                {weightGain > 0 ? "+" : ""}
                {weightGain.toFixed(1)} kg
              </div>
            </div>
          )}
        </div>

        {recentWeights.length > 1 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-duo-gray-dark">
              Últimos 7 registros
            </div>
            <div className="flex h-16 items-end gap-1">
              {recentWeights.map((entry, index) => {
                const height = ((entry.weight - minWeight) / range) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-duo-blue/30 transition-all hover:bg-duo-blue/50"
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`${entry.weight.toFixed(1)}kg`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

