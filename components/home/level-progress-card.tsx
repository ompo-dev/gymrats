"use client";

import { Trophy, Zap } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { cn } from "@/lib/utils";

interface LevelProgressCardProps {
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  ranking?: number | null;
}

export function LevelProgressCard({
  currentLevel,
  totalXP,
  xpToNextLevel,
  ranking,
}: LevelProgressCardProps) {
  // Fórmula: level = Math.floor(totalXP / 100) + 1
  // xpToNextLevel = level * 100 - totalXP
  // Exemplo: 250 XP = nível 3, precisa de 50 XP para nível 4
  // XP necessário para o nível atual = (currentLevel - 1) * 100
  // XP ganho no nível atual = totalXP - ((currentLevel - 1) * 100)
  // Cada nível requer 100 XP
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpGainedInCurrentLevel = totalXP - xpForCurrentLevel;
  const xpNeededForCurrentLevel = 100; // Cada nível requer 100 XP
  const progress = xpNeededForCurrentLevel > 0
    ? Math.min((xpGainedInCurrentLevel / xpNeededForCurrentLevel) * 100, 100)
    : 0;

  return (
    <SectionCard
      icon={Trophy}
      title="Seu Nível"
      className="space-y-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-duo-text">
              Nível {currentLevel}
            </div>
            {ranking !== null && ranking !== undefined && (
              <div className="text-xs text-duo-gray-dark">
                Top {ranking}% global
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-duo-yellow">
              {totalXP.toLocaleString()} XP
            </div>
            <div className="text-xs text-duo-gray-dark">Total acumulado</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-duo-gray-dark">
              Progresso para nível {currentLevel + 1}
            </span>
            <span className="font-bold text-duo-blue">
              {xpToNextLevel} XP restantes
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-duo-blue to-duo-green transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

