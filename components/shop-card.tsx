"use client";

import { ShoppingBag, Zap, Flame, Dumbbell } from "lucide-react";
import { SectionCard } from "./ui/section-card";
import { DuoCard } from "./ui/duo-card";
import { Button } from "./ui/button";

export function ShopCard() {
  return (
    <SectionCard
      icon={ShoppingBag}
      title="Loja de Recursos"
      headerAction={
        <p className="text-xs text-duo-gray-dark">Troque XP por benefícios</p>
      }
    >
      <div className="space-y-3">
        <DuoCard
          variant="default"
          size="sm"
          className="flex items-center justify-between p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-duo-orange/10">
              <Flame className="h-5 w-5 text-duo-orange" />
            </div>
            <div>
              <p className="text-sm font-bold text-duo-text">
                Proteção de Streak
              </p>
              <p className="text-xs text-duo-gray-dark">1 dia de proteção</p>
            </div>
          </div>
          <Button
            variant="light-blue"
            size="sm"
            className="h-auto gap-1.5 px-3 py-1.5 text-xs"
          >
            <Zap className="h-3 w-3" />
            200
          </Button>
        </DuoCard>

        <DuoCard
          variant="default"
          size="sm"
          className="flex items-center justify-between p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-duo-green/10">
              <Dumbbell className="h-5 w-5 text-duo-green" />
            </div>
            <div>
              <p className="text-sm font-bold text-duo-text">
                Treino Personalizado
              </p>
              <p className="text-xs text-duo-gray-dark">Gerado por IA</p>
            </div>
          </div>
          <Button
            variant="light-blue"
            size="sm"
            className="h-auto gap-1.5 px-3 py-1.5 text-xs"
          >
            <Zap className="h-3 w-3" />
            500
          </Button>
        </DuoCard>
      </div>
    </SectionCard>
  );
}
