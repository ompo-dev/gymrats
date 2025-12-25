"use client";

import { Crown, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { Button } from "@/components/atoms/buttons/button";

interface SubscriptionStatusProps {
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    trialStart: Date | null;
    trialEnd: Date | null;
    isTrial: boolean;
    daysRemaining: number | null;
    activeStudents?: number;
    totalAmount?: number;
    billingPeriod?: "monthly" | "annual";
  };
  userType: "student" | "gym";
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
  daysRemaining: number | null;
  isLoading: boolean;
  onStartTrial: () => Promise<void>;
  onCancel: () => Promise<void>;
}

export function SubscriptionStatus({
  subscription,
  userType,
  texts,
  isCanceled,
  hasTrial,
  isTrialActive,
  isPremiumActive,
  daysRemaining,
  isLoading,
  onStartTrial,
  onCancel,
}: SubscriptionStatusProps) {
  return (
    <SectionCard title={texts.subscriptionStatusTitle} icon={Crown}>
      <div className="space-y-4">
        {/* Header com status */}
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
                  : isCanceled
                  ? "bg-gray-200"
                  : "bg-gray-200"
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
                    : "text-gray-600"
                )}
              />
            </div>
            <div>
              <h3 className="font-bold text-duo-text capitalize">
                {subscription.plan}
              </h3>
              <p className="text-xs text-duo-gray-dark">
                {isCanceled && hasTrial
                  ? "Cancelada (Trial Ativo)"
                  : isTrialActive
                  ? "Trial Ativo"
                  : isPremiumActive
                  ? "Ativo"
                  : isCanceled
                  ? "Cancelada"
                  : "Sem assinatura"}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold",
              isCanceled && hasTrial
                ? "bg-duo-orange/20 text-duo-orange"
                : isTrialActive
                ? "bg-duo-blue/20 text-duo-blue"
                : isPremiumActive
                ? "bg-duo-green/20 text-duo-green"
                : isCanceled
                ? "bg-gray-200 text-gray-600"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {isCanceled && hasTrial
              ? "Cancelada"
              : isTrialActive
              ? "Trial Ativo"
              : isPremiumActive
              ? "Ativo"
              : isCanceled
              ? "Cancelada"
              : "Free"}
          </span>
        </div>

        {/* Trial Info */}
        {hasTrial && (
          <>
            <DuoCard variant={isCanceled ? "default" : "blue"} size="default">
              <div className="flex items-center gap-3">
                <Gift
                  className={cn(
                    "h-8 w-8",
                    isCanceled ? "text-duo-orange" : "text-duo-blue"
                  )}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-duo-text">
                    {isCanceled
                      ? "Trial Ativo (Cancelada)"
                      : "Trial Gratuito Ativo"}
                  </h3>
                  {isCanceled && (
                    <p className="text-xs text-duo-orange mt-1 font-bold">
                      Sua assinatura foi cancelada, mas você ainda pode usar o
                      trial até o fim do período.
                    </p>
                  )}
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-duo-blue">
                      {daysRemaining !== null
                        ? daysRemaining
                        : subscription.daysRemaining !== null
                        ? subscription.daysRemaining
                        : subscription.trialEnd
                        ? Math.max(
                            0,
                            Math.ceil(
                              (new Date(subscription.trialEnd).getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )
                        : 0}
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
                  {subscription.trialEnd && (
                    <p className="text-xs text-duo-gray-dark mt-1">
                      {texts.trialValidUntil}{" "}
                      {new Date(subscription.trialEnd).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </p>
                  )}
                </div>
              </div>
            </DuoCard>

            <div className="pt-3 border-t-2 border-duo-border">
              {isCanceled ? (
                <Button
                  onClick={onStartTrial}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                >
                  {isLoading ? "Reativando..." : "Reativar Trial"}
                </Button>
              ) : (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {texts.cancelTrialButton}
                </Button>
              )}
            </div>
          </>
        )}

        {/* Premium Active Info */}
        {isPremiumActive && (
          <div className="space-y-2 pt-3 border-t-2 border-duo-border">
            {userType === "gym" &&
              subscription.activeStudents !== undefined && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-duo-gray-dark">Alunos ativos</p>
                    <p className="text-lg font-bold text-duo-text">
                      {subscription.activeStudents}
                    </p>
                  </div>
                  {subscription.totalAmount !== undefined && (
                    <div>
                      <p className="text-xs text-duo-gray-dark">Valor mensal</p>
                      <p className="text-lg font-bold text-duo-green">
                        R$ {subscription.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-duo-gray-dark">{texts.nextRenewal}</span>
              <span className="font-bold text-duo-text">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                  "pt-BR"
                )}
              </span>
            </div>
            <div className="mt-3">
              {isCanceled ? (
                <Button
                  onClick={onStartTrial}
                  disabled={isLoading}
                  className="w-full"
                  size="sm"
                >
                  {isLoading ? "Reativando..." : "Reativar Assinatura"}
                </Button>
              ) : (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {texts.cancelSubscriptionButton}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
