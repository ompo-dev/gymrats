"use client";

import { Flame, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface StreakModalProps {
  open: boolean;
  onClose: () => void;
  currentStreak: number;
}

export function StreakModal({
  open,
  onClose,
  currentStreak,
}: StreakModalProps) {
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const today = new Date().getDay();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-duo-border bg-white p-0">
        <div className="p-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <Flame className="h-20 w-20 fill-duo-orange text-duo-orange animate-pulse-glow" />
              <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {currentStreak}
                </span>
              </div>
            </div>
          </div>

          <DialogTitle className="mb-2 text-2xl font-bold text-duo-text">
            {currentStreak} dia de sequência!
          </DialogTitle>
          <p className="mb-6 text-sm text-duo-gray-dark">
            Continue praticando todos os dias para manter sua sequência
          </p>

          {/* Calendar grid */}
          <div className="mb-6 rounded-2xl border-2 border-duo-border bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                Julho 2025
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="mb-2 text-xs font-bold text-duo-gray-dark">
                    {day}
                  </div>
                  <div
                    className={cn(
                      "mx-auto h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-all",
                      index <= today
                        ? "border-duo-orange bg-duo-orange/20 text-duo-orange font-bold"
                        : "border-duo-gray bg-white text-duo-gray-dark"
                    )}
                  >
                    {index === today && (
                      <Flame className="h-5 w-5 fill-duo-orange text-duo-orange" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-duo-yellow/10 border-2 border-duo-yellow/30 p-4">
            <p className="text-sm font-bold text-duo-text">
              Seu streak será reiniciado se você não praticar amanhã. Cuidado!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
