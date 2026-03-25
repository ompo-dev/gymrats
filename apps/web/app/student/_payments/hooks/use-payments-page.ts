"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useModalState } from "@/hooks/use-modal-state";
import { usePaymentFlow } from "@/hooks/use-payment-flow";
import { useStudent } from "@/hooks/use-student";
import { useStudentFinancialBootstrap } from "@/hooks/use-student-bootstrap";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import {
  centsToReais,
  STUDENT_PLANS_CONFIG,
} from "@/lib/access-control/plans-config";
import type { StudentGymMembership, StudentPayment } from "@/lib/types";
import type { SubscriptionData as StudentSubscriptionData } from "@/lib/types/student-unified";

export type PaymentsTab =
  | "memberships"
  | "payments"
  | "subscription"
  | "referrals";

export interface UsePaymentsPageProps {
  subscription?: StudentSubscriptionData | null;
  startTrial?: () => Promise<{ error?: string; success?: boolean }>;
}

export function usePaymentsPage(props: UsePaymentsPageProps = {}) {
  const { subscription: initialSubscription } = props;
  const paymentFlow = usePaymentFlow();
  const { toast } = useToast();
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("memberships"),
  );
  const [, setTab] = useQueryState("tab", parseAsString.withDefault("home"));
  const {
    subscription: bootstrapSubscription,
    memberships,
    payments,
    isLoading: isLoadingFinancial,
    refetch: refetchFinancial,
  } = useStudentFinancialBootstrap();
  const {
    subscription: subscriptionData,
    isLoading: isLoadingSubscription,
    isFirstPayment,
    startTrial: startTrialHook,
    isStartingTrial,
    createSubscription: createSubscriptionRequest,
    isCreatingSubscription,
    cancelSubscription,
    isCancelingSubscription,
    refetch: refetchSubscription,
  } = useSubscription({
    includeDaysRemaining: true,
    includeTrialInfo: true,
    enabled: false,
  });
  const actions = useStudent("actions");
  const {
    cancelMembership: cancelMembershipAction,
    loadGymPlans,
    changeMembershipPlan,
    applyReferralToSubscription,
    getStudentPaymentStatus,
  } = actions;
  const cancelDialogModal = useModalState("cancel-subscription");

  const [activeTab, setActiveTab] = useState<PaymentsTab>("memberships");
  const [expandedMembershipId, setExpandedMembershipId] = useState<
    string | null
  >(null);
  const [changePlanPlans, setChangePlanPlans] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      price: number;
      duration: number;
    }>
  >([]);
  const [changePlanMembershipId, setChangePlanMembershipId] = useState<
    string | null
  >(null);
  const [pixModal, setPixModal] = useState<{
    paymentId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
  } | null>(null);
  const [subscriptionPixModal, setSubscriptionPixModal] = useState<{
    pixId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
    originalAmount?: number;
    canApplyReferral?: boolean;
  } | null>(null);
  const [_daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (
      subTab &&
      ["memberships", "payments", "subscription", "referrals"].includes(subTab)
    ) {
      setActiveTab(subTab as PaymentsTab);
    }
  }, [subTab]);

  const subscription: StudentSubscriptionData | null =
    (subscriptionData as StudentSubscriptionData | null | undefined) ??
    bootstrapSubscription ??
    initialSubscription ??
    null;

  useEffect(() => {
    if (
      subscription?.daysRemaining !== null &&
      subscription?.daysRemaining !== undefined
    ) {
      setDaysRemaining(subscription.daysRemaining);
    }
  }, [subscription?.daysRemaining]);

  const isLoading =
    isLoadingFinancial ||
    isLoadingSubscription ||
    isStartingTrial ||
    isCreatingSubscription ||
    isCancelingSubscription;

  useEffect(() => {
    if (subscription?.trialEnd) {
      const trialEndDate = subscription.trialEnd;
      const updateDaysRemaining = () => {
        const now = new Date();
        const trialEnd = new Date(trialEndDate);
        const diff = trialEnd.getTime() - now.getTime();
        const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        setDaysRemaining(days);
      };

      updateDaysRemaining();
      const interval = setInterval(updateDaysRemaining, 60000);

      return () => clearInterval(interval);
    }

    if (
      subscription?.daysRemaining !== null &&
      subscription?.daysRemaining !== undefined
    ) {
      setDaysRemaining(subscription.daysRemaining);
    }
  }, [subscription?.trialEnd, subscription?.daysRemaining]);

  useEffect(() => {
    if (activeTab === "subscription") {
      void Promise.all([refetchSubscription(), refetchFinancial()]);
    }
  }, [activeTab, refetchFinancial, refetchSubscription]);

  const isLoadingPayments = isLoadingFinancial && payments.length === 0;

  const pendingPayments = payments.filter(
    (payment: StudentPayment) =>
      payment.status === "pending" || payment.status === "overdue",
  );
  const totalMonthly = memberships
    .filter(
      (membership: StudentGymMembership) => membership.status === "active",
    )
    .reduce(
      (sum: number, membership: StudentGymMembership) =>
        sum + membership.amount,
      0,
    );

  const availablePlans = useMemo(
    () =>
      Object.values(STUDENT_PLANS_CONFIG).map((config) => ({
        id: config.id,
        name: config.name,
        monthlyPrice: centsToReais(config.prices.monthly),
        annualPrice: centsToReais(config.prices.annual),
        features: config.features,
      })),
    [],
  );

  const handleCancelMembership = async (membershipId: string) => {
    try {
      await cancelMembershipAction(membershipId);
      await paymentFlow.invalidatePaymentQueries();
      toast({
        title: "Plano cancelado",
        description: "Sua mensalidade na academia foi cancelada.",
      });
      setExpandedMembershipId(null);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao cancelar";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    }
  };

  const handleTrocarPlanoClick = async (membership: StudentGymMembership) => {
    try {
      const otherPlans = (await loadGymPlans(membership.gymId)).filter(
        (plan) => plan.id !== membership.planId,
      );
      if (otherPlans.length === 0) {
        toast({
          title: "Sem opções",
          description: "Não há outros planos disponíveis nesta academia.",
        });
        return;
      }
      setChangePlanPlans(otherPlans);
      setChangePlanMembershipId(membership.id);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao carregar planos";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    }
  };

  const handleSelectChangePlan = async (planId: string) => {
    if (!changePlanMembershipId) {
      return;
    }

    try {
      const result = await changeMembershipPlan({
        membershipId: changePlanMembershipId,
        planId,
      });
      await paymentFlow.invalidatePaymentQueries();
      setPixModal({
        paymentId: result.paymentId,
        brCode: result.brCode,
        brCodeBase64: result.brCodeBase64,
        amount: result.amount,
        expiresAt: result.expiresAt,
      });
      setChangePlanPlans([]);
      setChangePlanMembershipId(null);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao trocar plano";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    }
  };

  const handlePixConfirmed = async () => {
    await Promise.all([
      paymentFlow.invalidatePaymentQueries(),
      refetchSubscription(),
    ]);
  };

  const handlePayNowClick = async (payment: StudentPayment) => {
    try {
      const result = await paymentFlow.payNow.mutateAsync(payment.id);
      setPixModal({
        paymentId: result.paymentId,
        brCode: result.brCode,
        brCodeBase64: result.brCodeBase64,
        amount: result.amount,
        expiresAt: result.expiresAt,
      });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao gerar PIX";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    }
  };

  const handleCancelPayment = useCallback(
    async (paymentId: string) => {
      await paymentFlow.cancelPayment.mutateAsync(paymentId);
    },
    [paymentFlow.cancelPayment],
  );

  const handleStartTrial = async () => {
    try {
      const result = await startTrialHook();

      if (result.error) {
        if (result.error.includes("já existe")) {
          await Promise.all([
            paymentFlow.invalidatePaymentQueries(),
            refetchSubscription(),
          ]);
          setActiveTab("subscription");
          setSubTab("subscription");
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
        return;
      }

      if (result.success) {
        await Promise.all([
          paymentFlow.invalidatePaymentQueries(),
          refetchSubscription(),
        ]);
        setActiveTab("subscription");
        setSubTab("subscription");
        toast({
          title: "Trial iniciado",
          description: "Seu trial de 14 dias foi iniciado com sucesso!",
        });
      }
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Erro ao iniciar trial. Tente novamente.";
      toast({
        variant: "destructive",
        title: "Erro ao iniciar trial",
        description: msg,
      });
    }
  };

  const doCreateSubscription = async (
    billingPeriod: "monthly" | "annual",
    referralCode: string | null,
  ) => {
    try {
      const result = await createSubscriptionRequest(
        billingPeriod,
        referralCode,
      );
      const pix = result as {
        pixId?: string;
        brCode?: string;
        brCodeBase64?: string;
        amount?: number;
        expiresAt?: string;
        canApplyReferral?: boolean;
      };
      if (pix.pixId && pix.brCode) {
        await Promise.all([
          paymentFlow.invalidatePaymentQueries(),
          refetchSubscription(),
        ]);
        return {
          pixId: pix.pixId,
          brCode: pix.brCode,
          brCodeBase64: pix.brCodeBase64 ?? "",
          amount: pix.amount ?? 0,
          expiresAt: pix.expiresAt,
          canApplyReferral: pix.canApplyReferral ?? false,
        };
      }
      return null;
    } catch (error) {
      console.error("[doCreateSubscription] Erro:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        variant: "destructive",
        title: "Erro ao criar PIX de assinatura",
        description:
          err.response?.data?.message ||
          (err instanceof Error ? err.message : undefined) ||
          "Ocorreu um erro. Tente novamente.",
      });
      return null;
    }
  };

  const handleUpgrade = async (
    _planId: string,
    billingPeriod: "monthly" | "annual",
    referralCode?: string | null,
  ) => {
    const pixData = await doCreateSubscription(
      billingPeriod,
      referralCode ?? null,
    );
    if (pixData) {
      setSubscriptionPixModal({
        pixId: pixData.pixId,
        brCode: pixData.brCode,
        brCodeBase64: pixData.brCodeBase64,
        amount: pixData.amount,
        expiresAt: pixData.expiresAt,
        canApplyReferral: pixData.canApplyReferral ?? false,
        originalAmount: (pixData as { originalAmount?: number }).originalAmount,
      });
    }
  };

  const handleApplyReferralStudent = useCallback(
    async (referralCode: string) => {
      const data = await applyReferralToSubscription(referralCode);
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
          originalAmount: data.originalPrice,
        };
        setSubscriptionPixModal(newPix);
        return newPix;
      }

      return { error: "Resposta inválida" };
    },
    [applyReferralToSubscription],
  );

  const checkSubscriptionIsActive = useCallback(async () => {
    const latestSubscription = (await refetchSubscription()) as
      | StudentSubscriptionData
      | null
      | undefined;
    await Promise.all([paymentFlow.invalidatePaymentQueries()]);
    return latestSubscription?.status === "active";
  }, [paymentFlow, refetchSubscription]);

  const handleCancelConfirm = async () => {
    cancelDialogModal.close();
    try {
      const result = await cancelSubscription();
      if (!result.success && result.error) {
        toast({
          variant: "destructive",
          title: "Erro ao cancelar",
          description: result.error,
        });
      } else {
        await Promise.all([
          paymentFlow.invalidatePaymentQueries(),
          refetchSubscription(),
        ]);
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

  const hasTrial =
    subscription?.trialEnd && new Date(subscription.trialEnd) > new Date();
  const isTrialActive =
    subscription?.plan.toLowerCase().includes("premium") &&
    (subscription.status === "trialing" || hasTrial);

  const setTabChange = (value: PaymentsTab) => {
    setActiveTab(value);
    setSubTab(value);
  };

  return {
    activeTab,
    subscription,
    memberships,
    payments,
    pendingPayments,
    totalMonthly,
    availablePlans,
    isLoading,
    isLoadingPayments,
    isStartingTrial,
    isCreatingSubscription,
    isCancelingSubscription,
    isTrialActive,
    expandedMembershipId,
    setExpandedMembershipId,
    changePlanPlans,
    changePlanMembershipId,
    setChangePlanPlans,
    setChangePlanMembershipId,
    pixModal,
    setPixModal,
    subscriptionPixModal,
    setSubscriptionPixModal,
    isFirstPayment,
    refetchSubscription,
    cancelDialogModal,
    setTab,
    setTabChange,
    handleCancelMembership,
    handleTrocarPlanoClick,
    handleSelectChangePlan,
    handlePixConfirmed,
    handlePayNowClick,
    handleCancelPayment,
    handleStartTrial,
    handleUpgrade,
    handleApplyReferralStudent,
    checkSubscriptionIsActive,
    handleCancelConfirm,
    getStudentPaymentStatus,
  };
}
