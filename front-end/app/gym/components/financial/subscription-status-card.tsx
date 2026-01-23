"use client";

import { Crown, Gift, AlertCircle } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { cn } from "@/lib/utils";

interface SubscriptionStatusCardProps {
  subscription: {
    id: string;
    plan: string;
    status: string;
    isTrial: boolean;
    daysRemaining: number | null;
    activeStudents: number;
    totalAmount: number;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
  onCancel: () => void;
  isCanceling: boolean;
}

export function SubscriptionStatusCard({
  subscription,
  onCancel,
  isCanceling,
}: SubscriptionStatusCardProps) {
  const isTrialActive =
    subscription.isTrial && subscription.status === "trialing";
  const isPremiumActive =
    subscription.plan === "premium" &&
    subscription.status === "active" &&
    !subscription.isTrial;

  return (
    <SectionCard title="Status da Assinatura" icon={Crown}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                isTrialActive
                  ? "bg-duo-blue/20"
                  : isPremiumActive
                  ? "bg-duo-green/20"
                  : "bg-gray-200"
              )}
            >
              <Crown
                className={cn(
                  "h-6 w-6",
                  isTrialActive
                    ? "text-duo-blue"
                    : isPremiumActive
                    ? "text-duo-green"
                    : "text-gray-600"
                )}
              />
            </div>
            <div>
              <h3 className="font-bold text-duo-text capitalize">
                {subscription.plan}
              </h3>
              <p className="text-xs text-duo-gray-dark">
                {isTrialActive
                  ? "Trial Ativo"
                  : isPremiumActive
                  ? "Ativo"
                  : "Sem assinatura"}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold",
              isTrialActive
                ? "bg-duo-blue/20 text-duo-blue"
                : isPremiumActive
                ? "bg-duo-green/20 text-duo-green"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {isTrialActive
              ? "Trial Ativo"
              : isPremiumActive
              ? "Ativo"
              : "Sem Assinatura"}
          </span>
        </div>

        {isTrialActive && subscription.daysRemaining !== null && (
          <DuoCard variant="blue" size="default">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-duo-blue" />
              <div className="flex-1">
                <h3 className="font-bold text-duo-text">
                  Trial Gratuito Ativo
                </h3>
                <p className="text-sm text-duo-gray-dark">
                  {subscription.daysRemaining} dias restantes para experimentar
                  todas as funcionalidades
                </p>
              </div>
            </div>
          </DuoCard>
        )}

        {subscription.status === "active" && (
          <div className="space-y-3 pt-3 border-t-2 border-duo-border">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-duo-gray-dark">Alunos ativos</p>
                <p className="text-lg font-bold text-duo-text">
                  {subscription.activeStudents}
                </p>
              </div>
              <div>
                <p className="text-xs text-duo-gray-dark">Valor mensal</p>
                <p className="text-lg font-bold text-duo-green">
                  R$ {subscription.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-3 border-t border-duo-border">
              <span className="text-duo-gray-dark">Próxima renovação</span>
              <span className="font-bold text-duo-text">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                  "pt-BR"
                )}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-duo-orange">
                <AlertCircle className="h-4 w-4" />
                <span>Cancelamento agendado para o fim do período</span>
              </div>
            )}
            {!subscription.cancelAtPeriodEnd && (
              <Button
                onClick={onCancel}
                disabled={isCanceling}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {isCanceling ? "Cancelando..." : "Cancelar Assinatura"}
              </Button>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

