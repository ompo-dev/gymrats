"use client";

import { Crown, Gift } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";

interface SubscriptionStatusProps {
  subscription: {
    id?: string;
    plan: string;
    status: string;
    currentPeriodStart?: Date | string;
    currentPeriodEnd?: Date | string;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | string | null;
    trialStart?: Date | string | null;
    trialEnd?: Date | string | null;
    isTrial?: boolean;
    daysRemaining?: number | null;
    activeStudents?: number;
    activePersonals?: number;
    basePrice?: number;
    pricePerStudent?: number;
    pricePerPersonal?: number;
    totalAmount?: number;
    billingPeriod?: "monthly" | "annual";
    source?: "OWN" | "GYM_ENTERPRISE";
    enterpriseGymName?: string;
  };
  userType: "student" | "gym" | "personal";
  texts: {
    subscriptionStatusTitle: string;
    trialDaysRemaining: string;
    trialValidUntil: string;
    cancelTrialButton: string;
    cancelSubscriptionButton: string;
    nextRenewal: string;
  };
  isCanceled: boolean;
  hasTrial: boolean;
  isTrialActive: boolean;
  isPremiumActive: boolean;
  isPendingPayment?: boolean;
  daysRemaining: number | null;
  isLoading: boolean;
  onStartTrial: () => Promise<void>;
  onCancel: () => Promise<void>;
}

function formatPlanLabel(plan: string) {
  if (plan === "basic") return "Basico";
  if (plan === "premium") return "Premium";
  if (plan === "enterprise") return "Enterprise";
  if (plan === "pro_ai") return "Pro AI";
  return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
}

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function SubscriptionStatusSimple({
  subscription,
  userType,
  texts,
  isCanceled,
  hasTrial,
  isTrialActive,
  isPremiumActive,
  isPendingPayment,
  daysRemaining,
  isLoading,
  onStartTrial,
  onCancel,
}: SubscriptionStatusProps) {
  const activeStudents = subscription.activeStudents ?? 0;
  const activePersonals = subscription.activePersonals ?? 0;
  const basePrice = subscription.basePrice ?? 0;
  const pricePerStudent = subscription.pricePerStudent ?? 0;
  const pricePerPersonal = subscription.pricePerPersonal ?? 0;
  const studentVariableAmount = pricePerStudent * activeStudents;
  const personalVariableAmount = pricePerPersonal * activePersonals;

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
            {texts.subscriptionStatusTitle}
          </h2>
        </div>
      </DuoCard.Header>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                isCanceled && hasTrial
                  ? "bg-duo-orange/20"
                  : isTrialActive
                    ? "bg-duo-blue/20"
                    : isPremiumActive
                      ? "bg-duo-green/20"
                      : "bg-gray-200",
              )}
            >
              <Crown
                className={cn(
                  "h-6 w-6",
                  isCanceled && hasTrial
                    ? "text-duo-orange"
                    : isTrialActive
                      ? "text-duo-blue"
                      : isPremiumActive
                        ? "text-duo-green"
                        : "text-gray-600",
                )}
              />
            </div>
            <div>
              <h3 className="font-bold text-duo-text">
                {formatPlanLabel(String(subscription.plan))}
                {subscription.billingPeriod ? (
                  <span className="text-duo-gray-dark font-normal ml-1">
                    ({subscription.billingPeriod === "annual" ? "Anual" : "Mensal"})
                  </span>
                ) : null}
              </h3>
              <p className="text-xs text-duo-gray-dark">
                {isCanceled && hasTrial
                  ? "Cancelada (Trial ativo)"
                  : isTrialActive
                    ? "Trial ativo"
                    : isPremiumActive
                      ? "Ativo"
                      : isPendingPayment
                        ? "Processando..."
                        : isCanceled
                          ? "Cancelada"
                          : subscription.source === "GYM_ENTERPRISE"
                            ? subscription.enterpriseGymName || "Via academia"
                            : "Sem assinatura"}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold",
              subscription.source === "GYM_ENTERPRISE"
                ? "bg-duo-purple/20 text-duo-purple"
                : isCanceled && hasTrial
                  ? "bg-duo-orange/20 text-duo-orange"
                  : isTrialActive
                    ? "bg-duo-blue/20 text-duo-blue"
                    : isPremiumActive
                      ? "bg-duo-green/20 text-duo-green"
                      : "bg-gray-200 text-gray-600",
            )}
          >
            {subscription.source === "GYM_ENTERPRISE"
              ? subscription.enterpriseGymName || "Via academia"
              : isCanceled && hasTrial
                ? "Cancelada"
                : isTrialActive
                  ? "Trial ativo"
                  : isPremiumActive
                    ? "Ativo"
                    : isPendingPayment
                      ? "Aguardando"
                      : isCanceled
                        ? "Cancelada"
                        : "Free"}
          </span>
        </div>

        {subscription.source === "GYM_ENTERPRISE" ? (
          <DuoCard.Root
            variant="default"
            className="border-duo-purple/30 bg-duo-purple/5"
          >
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-duo-purple" />
              <div className="flex-1">
                <h3 className="font-bold text-duo-text">
                  Plano Premium Gratuito
                </h3>
                <p className="text-xs text-duo-purple font-bold">
                  Beneficio concedido por{" "}
                  {subscription.enterpriseGymName || "sua academia"}.
                </p>
                <p className="text-xs text-duo-gray-dark mt-2">
                  Voce tem acesso Premium completo enquanto estiver vinculado a
                  uma academia Enterprise.
                </p>
              </div>
            </div>
          </DuoCard.Root>
        ) : null}

        {hasTrial ? (
          <>
            <DuoCard.Root
              variant={isCanceled ? "default" : "blue"}
              size="default"
            >
              <div className="flex items-center gap-3">
                <Gift
                  className={cn(
                    "h-8 w-8",
                    isCanceled ? "text-duo-orange" : "text-duo-blue",
                  )}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-duo-text">
                    {isCanceled ? "Assinatura Cancelada" : "Trial Gratuito Ativo"}
                  </h3>
                  {isCanceled ? (
                    <p className="text-xs text-duo-orange mt-1 font-bold">
                      Sua assinatura foi cancelada. O acesso premium foi
                      revogado.
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-duo-blue">
                      {daysRemaining !== null
                        ? daysRemaining
                        : subscription.daysRemaining ?? 0}
                    </span>
                    <span className="text-sm text-duo-gray-dark">
                      {daysRemaining === 1 || subscription.daysRemaining === 1
                        ? "dia restante"
                        : texts.trialDaysRemaining}
                    </span>
                  </div>
                  <p className="text-xs text-duo-gray-dark mt-1">
                    Experimente todas as funcionalidades Premium
                  </p>
                  {subscription.trialEnd ? (
                    <p className="text-xs text-duo-gray-dark mt-1">
                      {texts.trialValidUntil} {formatDate(subscription.trialEnd)}
                    </p>
                  ) : null}
                </div>
              </div>
            </DuoCard.Root>

            <div className="pt-3 border-t-2 border-duo-border">
              {isCanceled ? (
                <DuoButton
                  onClick={onStartTrial}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                  variant="primary"
                >
                  {isLoading ? "Reativando..." : "Reativar Trial"}
                </DuoButton>
              ) : (
                <DuoButton
                  onClick={onCancel}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {texts.cancelTrialButton}
                </DuoButton>
              )}
            </div>
          </>
        ) : null}

        {isPremiumActive ? (
          <div className="space-y-2 pt-3 border-t-2 border-duo-border">
            {userType === "gym" ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-duo-gray-dark">Alunos ativos</p>
                    <p className="text-lg font-bold text-duo-text">
                      {activeStudents}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-duo-gray-dark">
                      Personais filiados
                    </p>
                    <p className="text-lg font-bold text-duo-text">
                      {activePersonals}
                    </p>
                  </div>
                  {subscription.totalAmount !== undefined ? (
                    <div>
                      <p className="text-xs text-duo-gray-dark">
                        {subscription.billingPeriod === "annual"
                          ? "Valor anual"
                          : "Valor mensal"}
                      </p>
                      <p className="text-lg font-bold text-duo-green">
                        {formatCurrency(subscription.totalAmount)}
                      </p>
                    </div>
                  ) : null}
                </div>

                {subscription.billingPeriod === "annual" ? (
                  <div className="rounded-xl border border-duo-border bg-duo-bg p-3 text-sm text-duo-gray-dark">
                    O plano anual e fixo: nao ha cobranca adicional por aluno
                    nem por personal filiado durante o periodo.
                  </div>
                ) : (
                  <div className="rounded-xl border border-duo-border bg-duo-bg p-3 space-y-2 text-sm text-duo-gray-dark">
                    <div className="flex items-center justify-between">
                      <span>Base do plano</span>
                      <span className="font-semibold text-duo-text">
                        {formatCurrency(basePrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        Alunos ativos ({activeStudents} x {formatCurrency(pricePerStudent)})
                      </span>
                      <span className="font-semibold text-duo-text">
                        {formatCurrency(studentVariableAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        Personais filiados ({activePersonals} x {formatCurrency(pricePerPersonal)})
                      </span>
                      <span className="font-semibold text-duo-text">
                        {formatCurrency(personalVariableAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            <div className="flex items-center justify-between text-sm">
              <span className="text-duo-gray-dark">
                {subscription.source === "GYM_ENTERPRISE"
                  ? "Status do beneficio"
                  : texts.nextRenewal}
              </span>
              <span className="font-bold text-duo-text">
                {subscription.source === "GYM_ENTERPRISE"
                  ? "Vitalicio via academia"
                  : formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
            <div className="mt-3">
              {subscription.source === "GYM_ENTERPRISE" ? (
                <p className="text-xs text-center text-duo-gray-dark italic">
                  Assinatura gerenciada pela academia parceira.
                </p>
              ) : isCanceled ? (
                <DuoButton
                  onClick={onStartTrial}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                  variant="primary"
                >
                  {isLoading ? "Reativando..." : "Reativar Assinatura"}
                </DuoButton>
              ) : (
                <DuoButton
                  onClick={onCancel}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {texts.cancelSubscriptionButton}
                </DuoButton>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DuoCard.Root>
  );
}

export const SubscriptionStatus = { Simple: SubscriptionStatusSimple };
