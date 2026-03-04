"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useModalState } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";
import {
  STUDENT_PLANS_CONFIG,
  centsToReais,
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
  const { subscription: initialSubscription, startTrial: _startTrial } = props;

  useLoadPrioritized({ context: "payments" });

  const { toast } = useToast();
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("memberships"),
  );
  const [, setTab] = useQueryState("tab", parseAsString.withDefault("home"));

  const {
    subscription: storeSubscription,
    memberships: storeMemberships,
    payments: storePayments,
    paymentMethods: storePaymentMethods,
  } = useStudent("subscription", "memberships", "payments", "paymentMethods");

  const {
    subscription: subscriptionData,
    isLoading: isLoadingSubscription,
    startTrial: startTrialHook,
    isStartingTrial,
    createSubscription: _createSubscription,
    isCreatingSubscription,
    cancelSubscription,
    isCancelingSubscription,
    refetch: refetchSubscription,
  } = useSubscription({
    includeDaysRemaining: true,
    includeTrialInfo: true,
    enabled: false,
  });

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
      ["memberships", "payments", "subscription"].includes(subTab)
    ) {
      setActiveTab(subTab as PaymentsTab);
    }
  }, [subTab]);

  const subFromStore = storeSubscription as
    | StudentSubscriptionData
    | null
    | undefined;
  const hasOptimisticUpdate = subFromStore?.id === "temp-trial-id";

  const subscription: StudentSubscriptionData | null = hasOptimisticUpdate
    ? (subFromStore as StudentSubscriptionData)
    : subFromStore !== null && subFromStore !== undefined
      ? (subFromStore as StudentSubscriptionData)
      : subscriptionData !== undefined && subscriptionData !== null
        ? subscriptionData
        : subscriptionData === null && initialSubscription
          ? initialSubscription
          : subscriptionData === null
            ? null
            : (initialSubscription ?? null);

  useEffect(() => {
    if (
      subscription?.daysRemaining !== null &&
      subscription?.daysRemaining !== undefined
    ) {
      setDaysRemaining(subscription.daysRemaining);
    }
  }, [subscription?.daysRemaining]);

  const isLoading =
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
    } else if (
      subscription?.daysRemaining !== null &&
      subscription?.daysRemaining !== undefined
    ) {
      setDaysRemaining(subscription.daysRemaining);
    }
  }, [subscription?.trialEnd, subscription?.daysRemaining]);

  const loaders = useStudent("loaders");
  const {
    loadSubscription,
    loadPaymentMethods,
    loadMemberships,
    loadPayments,
  } = loaders;

  // Ao abrir a aba Assinatura, refetch para ter source/enterpriseGymName atualizados
  useEffect(() => {
    if (activeTab === "subscription" && loadSubscription) {
      loadSubscription();
    }
  }, [activeTab, loadSubscription]);

  const membershipsArray = Array.isArray(storeMemberships)
    ? storeMemberships
    : [];
  const membershipsData = useMemo(() => {
    if (membershipsArray.length === 0) return [];
    return (membershipsArray as unknown as StudentGymMembership[]).map(
      (m: StudentGymMembership) => ({
        ...m,
        startDate: m.startDate
          ? m.startDate instanceof Date
            ? m.startDate
            : new Date(m.startDate)
          : new Date(),
        nextBillingDate: m.nextBillingDate
          ? m.nextBillingDate instanceof Date
            ? m.nextBillingDate
            : new Date(m.nextBillingDate)
          : undefined,
      }),
    );
  }, [membershipsArray]);

  const paymentsArray = Array.isArray(storePayments) ? storePayments : [];
  const paymentsData = useMemo(() => {
    if (paymentsArray.length === 0) return [];
    return (paymentsArray as unknown as StudentPayment[]).map(
      (p: StudentPayment) => ({
        ...p,
        date: p.date
          ? p.date instanceof Date
            ? p.date
            : new Date(p.date)
          : new Date(),
        dueDate: p.dueDate
          ? p.dueDate instanceof Date
            ? p.dueDate
            : new Date(p.dueDate)
          : new Date(),
      }),
    );
  }, [paymentsArray]);

  const memberships = membershipsData;
  const payments = paymentsData;
  const isLoadingPayments = !storePayments;

  const pendingPayments = payments.filter(
    (p: StudentPayment) => p.status === "pending" || p.status === "overdue",
  );
  const totalMonthly = memberships
    .filter((m: StudentGymMembership) => m.status === "active")
    .reduce((sum: number, m: StudentGymMembership) => sum + m.amount, 0);

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
      await apiClient.post(
        `/api/students/memberships/${membershipId}/cancel`,
        {},
      );
      toast({
        title: "Plano cancelado",
        description: "Sua mensalidade na academia foi cancelada.",
      });
      setExpandedMembershipId(null);
      await loadMemberships();
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
      const res = await apiClient.get<{
        plans: Array<{
          id: string;
          name: string;
          type: string;
          price: number;
          duration: number;
        }>;
      }>(`/api/students/gyms/${membership.gymId}/plans`);
      const otherPlans = (res.data.plans || []).filter(
        (p) => p.id !== membership.planId,
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
    if (!changePlanMembershipId) return;
    try {
      const res = await apiClient.post<{
        brCode: string;
        brCodeBase64: string;
        amount: number;
        paymentId: string;
        expiresAt?: string;
      }>(`/api/students/memberships/${changePlanMembershipId}/change-plan`, {
        planId,
      });
      setPixModal({
        paymentId: res.data.paymentId,
        brCode: res.data.brCode,
        brCodeBase64: res.data.brCodeBase64,
        amount: res.data.amount,
        expiresAt: res.data.expiresAt,
      });
      setChangePlanPlans([]);
      setChangePlanMembershipId(null);
      await Promise.all([loadMemberships(), loadPayments()]);
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
    await Promise.all([loadMemberships(), loadPayments()]);
  };

  const handlePayNowClick = async (payment: StudentPayment) => {
    try {
      const res = await apiClient.post<{
        paymentId: string;
        brCode: string;
        brCodeBase64: string;
        amount: number;
        expiresAt?: string;
      }>(`/api/students/payments/${payment.id}/pay-now`, {});
      setPixModal({
        paymentId: res.data.paymentId,
        brCode: res.data.brCode,
        brCodeBase64: res.data.brCodeBase64,
        amount: res.data.amount,
        expiresAt: res.data.expiresAt,
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

  const handleStartTrial = async () => {
    try {
      const result = await startTrialHook();

      if (result.error) {
        if (result.error.includes("já existe")) {
          await refetchSubscription();
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

  const isFirstPayment =
    (subscription as { isFirstPayment?: boolean } | null | undefined)
      ?.isFirstPayment ?? true;

  const doCreateSubscription = async (
    billingPeriod: "monthly" | "annual",
    referralCode: string | null,
  ) => {
    try {
      const result = await _createSubscription(billingPeriod, referralCode);
      const pix = result as {
        pixId?: string;
        brCode?: string;
        brCodeBase64?: string;
        amount?: number;
        expiresAt?: string;
        canApplyReferral?: boolean;
      };
      if (pix.pixId && pix.brCode) {
        await refetchSubscription();
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
    planId: string,
    billingPeriod: "monthly" | "annual",
    referralCode?: string | null,
  ) => {
    const billingKey = billingPeriod;
    const pixData = await doCreateSubscription(
      billingKey,
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

  const handleApplyReferralStudent = useCallback(async (referralCode: string) => {
    const res = await apiClient.post<{
      pixId?: string;
      brCode?: string;
      brCodeBase64?: string;
      amount?: number;
      expiresAt?: string;
      originalAmount?: number;
      error?: string;
      referralCodeInvalid?: boolean;
    }>("/api/subscriptions/apply-referral", {
      referralCode: referralCode.trim(),
    });
    const data = res.data;
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
      setSubscriptionPixModal(newPix);
      return newPix;
    }
    return { error: "Resposta inválida" };
  }, []);

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
    // State
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

    // UI state
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

    // Modals
    cancelDialogModal,

    // Handlers
    setTab,
    setTabChange,
    handleCancelMembership,
    handleTrocarPlanoClick,
    handleSelectChangePlan,
    handlePixConfirmed,
    handlePayNowClick,
    handleStartTrial,
    handleUpgrade,
    handleApplyReferralStudent,
    handleCancelConfirm,
  };
}
