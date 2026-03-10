"use client";

import { ArrowRightLeft, LogOut, Shield } from "lucide-react";
import { motion } from "motion/react";
import { DuoCard } from "@/components/duo";

interface GymSettingsAccountCardProps {
  isAdmin: boolean;
  onSwitchToStudent: () => void;
  onLogout: () => void;
}

export function GymSettingsAccountCard({
  isAdmin,
  onSwitchToStudent,
  onLogout,
}: GymSettingsAccountCardProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 shrink-0 text-duo-secondary" aria-hidden />
          <h2 className="font-bold text-duo-fg">Conta</h2>
        </div>
      </DuoCard.Header>
      <div className="space-y-3">
        {isAdmin && (
          <DuoCard.Root
            variant="default"
            size="default"
            className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
            onClick={onSwitchToStudent}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-duo-blue/10 p-3">
                <ArrowRightLeft className="h-5 w-5 text-duo-blue" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold text-duo-fg">
                  Trocar para Perfil de Aluno
                </div>
                <div className="text-xs text-duo-fg-muted">
                  Acessar como estudante
                </div>
              </div>
            </div>
          </DuoCard.Root>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
        >
          <DuoCard.Root
            variant="default"
            size="default"
            className="cursor-pointer transition-all hover:border-red-300 active:scale-[0.98]"
            onClick={onLogout}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-duo-danger/10 p-3">
                <LogOut className="h-5 w-5 text-duo-danger" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold text-duo-fg">Sair</div>
                <div className="text-xs text-duo-fg-muted">
                  Fazer logout da conta
                </div>
              </div>
            </div>
          </DuoCard.Root>
        </motion.div>
      </div>
    </DuoCard.Root>
  );
}
