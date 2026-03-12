"use client";

import { AlertCircle, Crown, Gift } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";
import { formatDatePtBr } from "@/lib/utils/date-safe";

interface SubscriptionStatusCardProps {
  subscription: {
    id: string;
    plan: string;
    status: string;
    isTrial: boolean;
    daysRemaining: number | null;
    activeStudents: number;
    activePersonals: number;
    basePrice: number;
    pricePerStudent: number;
    pricePerPersonal: number;
    totalAmount: number;
    billingPeriod?: "monthly" | "annual";
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
  const isPremiumActive = subscription.status === "active" && !subscription.isTrial;
  const studentVariableAmount =
    subscription.pricePerStudent * subscription.activeStudents;
  const personalVariableAmount =
    subscription.pricePerPersonal * subscription.activePersonals;

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Crown
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">
            Status da Assinatura
          </h2>
        </div>
      </DuoCard.Header>
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
                    : "bg-duo-gray",
              )}
            >
              <Crown
                className={cn(
                  "h-6 w-6",
                  isTrialActive
                    ? "text-duo-blue"
                    : isPremiumActive
                      ? "text-duo-green"
                      : "text-duo-gray-dark",
                )}
              />
            </div>
            <div>
              <h3 className="font-bold text-duo-text capitalize">
                {subscription.plan}
              </h3>
              <p className="text-xs text-duo-gray-dark">
                {isTrialActive
                  ? "Trial ativo"
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
                  : "bg-duo-gray text-duo-gray-dark",
            )}
          >
            {isTrialActive
              ? "Trial ativo"
              : isPremiumActive
                ? "Ativo"
                : "Sem assinatura"}
          </span>
        </div>

        {isTrialActive && subscription.daysRemaining !== null ? (
          <DuoCard.Root variant="blue" size="default">
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
          </DuoCard.Root>
        ) : null}

        {subscription.status === "active" ? (
          <div className="space-y-3 pt-3 border-t-2 border-duo-border">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div>
                <p className="text-xs text-duo-gray-dark">Alunos ativos</p>
                <p className="text-lg font-bold text-duo-text">
                  {subscription.activeStudents}
                </p>
              </div>
              <div>
                <p className="text-xs text-duo-gray-dark">Personais filiados</p>
                <p className="text-lg font-bold text-duo-text">
                  {subscription.activePersonals}
                </p>
              </div>
              <div>
                <p className="text-xs text-duo-gray-dark">
                  {subscription.billingPeriod === "annual"
                    ? "Valor anual"
                    : "Valor mensal"}
                </p>
                <p className="text-lg font-bold text-duo-green">
                  R$ {subscription.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {subscription.billingPeriod === "annual" ? (
              <div className="rounded-xl border border-duo-border bg-duo-bg p-3 text-sm text-duo-gray-dark">
                O plano anual e fixo, sem cobranca extra por aluno ou personal
                filiado.
              </div>
            ) : (
              <div className="rounded-xl border border-duo-border bg-duo-bg p-3 space-y-2 text-sm text-duo-gray-dark">
                <div className="flex items-center justify-between">
                  <span>Base do plano</span>
                  <span className="font-semibold text-duo-text">
                    R$ {subscription.basePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    Alunos ({subscription.activeStudents} x R${" "}
                    {subscription.pricePerStudent.toFixed(2)})
                  </span>
                  <span className="font-semibold text-duo-text">
                    R$ {studentVariableAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    Personais ({subscription.activePersonals} x R${" "}
                    {subscription.pricePerPersonal.toFixed(2)})
                  </span>
                  <span className="font-semibold text-duo-text">
                    R$ {personalVariableAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm pt-3 border-t border-duo-border">
              <span className="text-duo-gray-dark">Proxima renovacao</span>
              <span className="font-bold text-duo-text">
                {formatDatePtBr(subscription.currentPeriodEnd) || "N/A"}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd ? (
              <div className="flex items-center gap-2 text-sm text-duo-orange">
                <AlertCircle className="h-4 w-4" />
                <span>Cancelamento agendado para o fim do periodo</span>
              </div>
            ) : null}
            {!subscription.cancelAtPeriodEnd ? (
              <DuoButton
                onClick={onCancel}
                disabled={isCanceling}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {isCanceling ? "Cancelando..." : "Cancelar Assinatura"}
              </DuoButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </DuoCard.Root>
  );
}
