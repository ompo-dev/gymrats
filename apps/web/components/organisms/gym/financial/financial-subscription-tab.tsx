"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";
import { useGym } from "@/hooks/use-gym";
import { useGymSubscription } from "@/hooks/use-gym-subscription";
import { useToast } from "@/hooks/use-toast";
import {
  centsToReais,
  GYM_PLANS_CONFIG,
} from "@/lib/access-control/plans-config";
import { useGymsDataStore } from "@/stores/gyms-list-store";
import {
  type GymSubscriptionData,
  useSubscriptionStore,
} from "@/stores/subscription-store";

interface FinancialSubscriptionTabProps {
  subscription?: GymSubscriptionData | null;
}

const PENDING_PIX_KEY = "gym-pending-pix";
type SubscriptionSectionStatus =
  | "active"
  | "canceled"
  | "expired"
  | "past_due"
  | "trialing"
  | "pending_payment";

function normalizeSubscriptionStatus(
  status: string,
): SubscriptionSectionStatus {
  switch (status) {
    case "active":
    case "canceled":
    case "expired":
    case "past_due":
    case "trialing":
    case "pending_payment":
      return status;
    default:
      return "pending_payment";
  }
}

function loadPendingPixFromStorage(): {
  pixId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
  expiresAt?: string;
  originalAmount?: number;
  canApplyReferral?: boolean;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_PIX_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      pixId: string;
      brCode: string;
      brCodeBase64?: string;
      amount: number;
      expiresAt?: string;
      originalAmount?: number;
      canApplyReferral?: boolean;
      createdAt: number;
    };
    if (data.expiresAt && Date.now() > new Date(data.expiresAt).getTime()) {
      sessionStorage.removeItem(PENDING_PIX_KEY);
      return null;
    }
    return {
      pixId: data.pixId,
      brCode: data.brCode,
      brCodeBase64: data.brCodeBase64 ?? "",
      amount: data.amount,
      expiresAt: data.expiresAt,
      originalAmount: data.originalAmount,
      canApplyReferral: data.canApplyReferral,
    };
  } catch {
    return null;
  }
}

function savePendingPixToStorage(pix: {
  pixId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
  expiresAt?: string;
  originalAmount?: number;
  canApplyReferral?: boolean;
}) {
  sessionStorage.setItem(
    PENDING_PIX_KEY,
    JSON.stringify({ ...pix, createdAt: Date.now() }),
  );
}

function clearPendingPixStorage() {
  sessionStorage.removeItem(PENDING_PIX_KEY);
}

export function FinancialSubscriptionTab({
  subscription: initialSubscription,
}: FinancialSubscriptionTabProps) {
  const { toast } = useToast();
  const gymActions = useGym("actions");
  const { gymSubscription: storeSubscription } = useSubscriptionStore();
  const [pendingPix, setPendingPix] = useState<{
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
    originalAmount?: number;
    canApplyReferral?: boolean;
  } | null>(null);
  const {
    isFirstPayment,
    isLoading: isLoadingSubscription,
    startTrial: startTrialHook,
    isStartingTrial,
    createSubscription,
    isCreatingSubscription,
    cancelSubscription,
    isCancelingSubscription,
    refetch: refetchSubscription,
  } = useGymSubscription({
    includeDaysRemaining: true,
    includeTrialInfo: true,
    includeActiveStudents: true,
    enabled: false,
  });

  type SubscriptionType = typeof initialSubscription;

  const hasOptimisticUpdate =
    storeSubscription?.id === "temp-trial-id" ||
    (storeSubscription &&
      typeof storeSubscription === "object" &&
      "id" in storeSubscription &&
      (storeSubscription as { id?: string }).id === "temp-trial-id");

  const subscription: SubscriptionType =
    hasOptimisticUpdate && storeSubscription
      ? (storeSubscription as SubscriptionType)
      : storeSubscription !== null
        ? (storeSubscription as SubscriptionType)
        : initialSubscription;

  const refreshSubscription = useCallback(async () => {
    await refetchSubscription();
  }, [refetchSubscription]);

  const handlePaymentSuccess = useCallback(async () => {
    await refreshSubscription();
    await useGymsDataStore.getState().loadAllGyms();
  }, [refreshSubscription]);

  const handlePixSimulationSuccess = useCallback(async () => {
    await refreshSubscription();
  }, [refreshSubscription]);

  const checkSubscriptionPayment = useCallback(async () => {
    await refreshSubscription();
    return gymActions.checkCurrentSubscriptionActive();
  }, [gymActions, refreshSubscription]);

  const handlePixPaymentConfirmed = useCallback(() => {
    clearPendingPixStorage();
    void refreshSubscription();
    void useGymsDataStore.getState().loadAllGyms();
  }, [refreshSubscription]);

  const plans = useMemo(
    () =>
      Object.values(GYM_PLANS_CONFIG).map((config) => ({
        id: config.id,
        name: config.name,
        monthlyPrice: centsToReais(config.prices.monthly),
        annualPrice: centsToReais(config.prices.annual),
        perStudentPrice: centsToReais(config.pricePerStudent),
        perPersonalPrice: centsToReais(config.pricePerPersonal ?? 0),
        features: config.features,
      })),
    [],
  );

  const pollConfig = useMemo(
    () => ({
      type: "check" as const,
      check: checkSubscriptionPayment,
      intervalMs: 3000,
    }),
    [checkSubscriptionPayment],
  );

  // Restaurar PIX pendente ao voltar (ex.: fechou modal, foi ao banco, voltou)
  useEffect(() => {
    if (isLoadingSubscription) return;
    const stored = loadPendingPixFromStorage();
    if (!stored) return;
    if (subscription?.status === "active") {
      clearPendingPixStorage();
      return;
    }
    if (subscription?.status === "pending_payment") {
      setPendingPix(stored);
    }
  }, [isLoadingSubscription, subscription?.status]);

  // Refetch ao voltar para a aba (ex.: foi ao app do banco pagar)
  useEffect(() => {
    const hasPending = pendingPix || loadPendingPixFromStorage();
    if (!hasPending) return;
    const onFocus = () => refetchSubscription();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [pendingPix, refetchSubscription]);

  const handleStartTrial = async () => {
    try {
      const result = await startTrialHook();
      if (result.error) {
        if (result.error.includes("já existe")) {
          await refetchSubscription();
          toast({
            title: "Assinatura encontrada",
            description: "Você já possui uma assinatura ativa.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro ao iniciar trial",
            description: result.error,
          });
        }
      } else {
        toast({
          title: "Trial iniciado",
          description: "Seu trial de 14 dias foi iniciado com sucesso!",
        });
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro ao iniciar trial";
      toast({
        variant: "destructive",
        title: "Erro ao iniciar trial",
        description: msg,
      });
    }
  };

  const handleSubscribe = async (
    plan: string,
    billingPeriod: "monthly" | "annual",
    referralCode?: string | null,
  ) => {
    const planKey = plan as "basic" | "premium" | "enterprise";
    const billingKey = billingPeriod as "monthly" | "annual";
    const pixData = await doCreateSubscription(
      planKey,
      billingKey,
      referralCode ?? null,
    );
    if (pixData) {
      setPendingPix({
        pixId: pixData.pixId,
        brCode: pixData.brCode,
        brCodeBase64: pixData.brCodeBase64,
        amount: pixData.amount,
        expiresAt: pixData.expiresAt,
        canApplyReferral: pixData.canApplyReferral ?? false,
      });
      savePendingPixToStorage(pixData);
    }
  };

  const doCreateSubscription = async (
    plan: "basic" | "premium" | "enterprise",
    billingPeriod: "monthly" | "annual",
    referralCode: string | null,
  ) => {
    try {
      const result = await createSubscription(
        plan,
        billingPeriod,
        referralCode,
      );
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar assinatura",
          description: result.error,
        });
        return null;
      }
      const pix = result as {
        pixId?: string;
        brCode?: string;
        brCodeBase64?: string;
        amount?: number;
        expiresAt?: string;
        referralCodeInvalid?: boolean;
        canApplyReferral?: boolean;
      };
      if (pix.pixId && pix.brCode) {
        const pixData = {
          pixId: pix.pixId,
          brCode: pix.brCode,
          brCodeBase64: pix.brCodeBase64 ?? "",
          amount: pix.amount ?? 0,
          expiresAt: pix.expiresAt,
          canApplyReferral: pix.canApplyReferral ?? false,
          referralCodeInvalid: pix.referralCodeInvalid,
        };
        return pixData;
      }
      return null;
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro ao criar cobrança";
      toast({
        variant: "destructive",
        title: "Erro ao criar cobrança",
        description: msg,
      });
      return null;
    }
  };

  const handleApplyReferral = useCallback(
    async (referralCode: string) => {
      const data = await gymActions.applySubscriptionReferral(referralCode);
      if (data.error) {
        return {
          error: data.error,
          referralCodeInvalid: data.referralCodeInvalid,
        };
      }
      if (
        data.pixId &&
        data.brCode &&
        data.brCodeBase64 != null &&
        data.amount != null
      ) {
        const newPix = {
          pixId: data.pixId,
          brCode: data.brCode,
          brCodeBase64: data.brCodeBase64,
          amount: data.amount,
          expiresAt: data.expiresAt,
          originalAmount: data.originalAmount,
        };
        setPendingPix(newPix);
        savePendingPixToStorage(newPix);
        return newPix;
      }
      return { error: "Resposta inválida" };
    },
    [gymActions],
  );

  const handleCancel = async () => {
    try {
      // A atualização otimista já acontece no hook, então a UI já está atualizada
      const result = await cancelSubscription();
      if (!result.success && result.error) {
        toast({
          variant: "destructive",
          title: "Erro ao cancelar",
          description: result.error || "Erro ao cancelar assinatura",
        });
      } else {
        toast({
          title: "Assinatura cancelada",
          description: "Sua assinatura foi cancelada com sucesso.",
        });
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro ao cancelar assinatura";
      toast({
        variant: "destructive",
        title: "Erro ao cancelar assinatura",
        description: msg,
      });
    }
  };

  return (
    <>
      <SubscriptionSection.Simple
        userType="gym"
        subscription={
          subscription
            ? {
                id: subscription.id,
                plan: subscription.plan,
                status: normalizeSubscriptionStatus(subscription.status),
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                canceledAt: subscription.canceledAt,
                trialStart: subscription.trialStart,
                trialEnd: subscription.trialEnd,
                isTrial: subscription.isTrial,
                daysRemaining: subscription.daysRemaining,
                activeStudents: subscription.activeStudents,
                totalAmount: subscription.totalAmount,
                billingPeriod: subscription.billingPeriod ?? "monthly",
              }
            : null
        }
        onPaymentSuccess={async () => {
          await handlePaymentSuccess();
        }}
        isLoading={isLoadingSubscription}
        isStartingTrial={isStartingTrial}
        isCreatingSubscription={isCreatingSubscription}
        isCancelingSubscription={isCancelingSubscription}
        onStartTrial={handleStartTrial}
        onSubscribe={handleSubscribe}
        onCancel={handleCancel}
        isFirstPayment={isFirstPayment}
        plans={plans}
        showPlansWhen="always"
        trialEndingDays={3}
        texts={{
          trialTitle: "Experimente 14 dias grátis!",
          trialDescription:
            "Teste todas as funcionalidades Premium sem compromisso",
          trialButton: "Iniciar Trial Grátis",
          subscriptionStatusTitle: "Status da Assinatura",
          upgradeTitle: "Fazer Upgrade para Premium",
          choosePlanTitle: "Escolha seu Plano",
          subscribeButton: "Assinar Agora",
          cancelTrialButton: "Cancelar Trial",
          cancelSubscriptionButton: "Cancelar Assinatura",
          nextRenewal: "Próxima renovação",
        }}
      />
      {pendingPix && (
        <PixQrModal
          isOpen={!!pendingPix}
          onClose={() => {
            savePendingPixToStorage(pendingPix);
            setPendingPix(null);
            toast({
              title: "PIX salvo",
              description:
                "Volte aqui para ver o PIX novamente ou verificar se o pagamento foi confirmado.",
            });
          }}
          brCode={pendingPix.brCode}
          brCodeBase64={pendingPix.brCodeBase64}
          amount={pendingPix.amount}
          expiresAt={pendingPix.expiresAt}
          referralSlot={
            pendingPix.canApplyReferral && !pendingPix.originalAmount
              ? { onApplyReferral: handleApplyReferral }
              : undefined
          }
          valueSlot={
            pendingPix.originalAmount &&
            pendingPix.originalAmount > pendingPix.amount
              ? {
                  strikethrough: pendingPix.originalAmount,
                  badge: { code: "Indicação", discountString: "5%" },
                }
              : undefined
          }
          simulatePixUrl={`/api/gym-subscriptions/simulate-pix?pixId=${encodeURIComponent(pendingPix.pixId)}`}
          onSimulateSuccess={handlePixSimulationSuccess}
          pollConfig={pollConfig}
          onPaymentConfirmed={handlePixPaymentConfirmed}
          paymentConfirmedToast={{
            title: "Pagamento confirmado!",
            description: "Sua assinatura está ativa.",
          }}
        />
      )}
    </>
  );
}
