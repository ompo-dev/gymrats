"use client";

import { useState, useEffect } from "react";
import { parseAsString, useQueryState } from "nuqs";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Wallet,
  Building2,
  Crown,
  Sparkles,
  Gift,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  StudentGymMembership,
  StudentPayment,
  PaymentMethod,
} from "@/lib/types";
import {
  mockStudentMemberships,
  mockStudentPayments,
  mockPaymentMethods,
} from "@/lib/mock-data";
import { OptionSelector } from "@/components/ui/option-selector";
import { useToast } from "@/hooks/use-toast";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { Button } from "@/components/ui/button";
import {
  useSubscription,
  type SubscriptionData,
} from "@/hooks/use-subscription";
import { SubscriptionCancelDialog } from "@/components/subscription-cancel-dialog";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { SubscriptionSection } from "@/components/subscription-section";

// Constante fora do componente para garantir que seja sempre o mesmo entre servidor e cliente
const TAB_OPTIONS = [
  { value: "memberships", label: "Academias", emoji: "🏢" },
  { value: "payments", label: "Histórico", emoji: "📅" },
  { value: "methods", label: "Métodos", emoji: "💳" },
  { value: "subscription", label: "Assinatura", emoji: "👑" },
];

interface StudentPaymentsPageProps {
  subscription?: {
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
  } | null;
  startTrial?: () => Promise<{ error?: string; success?: boolean }>;
}

export function StudentPaymentsPage({
  subscription: initialSubscription,
  startTrial,
}: StudentPaymentsPageProps = {}) {
  const { toast } = useToast();
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("memberships")
  );

  const {
    subscription: subscriptionData,
    isLoading: isLoadingSubscription,
    startTrial: startTrialHook,
    isStartingTrial,
    createSubscription,
    isCreatingSubscription,
    cancelSubscription,
    isCancelingSubscription,
    refetch: refetchSubscription,
  } = useSubscription({
    includeDaysRemaining: true,
    includeTrialInfo: true,
  });

  const {
    subscription: storeSubscription,
    setSubscription: setStoreSubscription,
  } = useSubscriptionStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "memberships" | "payments" | "methods" | "subscription"
  >("memberships");

  useEffect(() => {
    if (subTab) {
      setActiveTab(
        subTab as "memberships" | "payments" | "methods" | "subscription"
      );
    }
  }, [subTab]);

  const hasOptimisticUpdate = storeSubscription?.id === "temp-trial-id";

  const subscription: SubscriptionData | null = hasOptimisticUpdate
    ? storeSubscription
    : subscriptionData !== undefined && subscriptionData !== null
    ? subscriptionData
    : storeSubscription !== null
    ? storeSubscription
    : subscriptionData === null && initialSubscription
    ? initialSubscription
    : subscriptionData === null
    ? null
    : initialSubscription || null;

  // Atualizar daysRemaining quando subscription mudar
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
  const [daysRemaining, setDaysRemaining] = useState<number | null>(
    subscription?.daysRemaining ?? null
  );

  useEffect(() => {
    if (subscription?.trialEnd) {
      const updateDaysRemaining = () => {
        const now = new Date();
        const trialEnd = new Date(subscription.trialEnd!);
        const diff = trialEnd.getTime() - now.getTime();
        const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        setDaysRemaining(days);
      };

      updateDaysRemaining();
      const interval = setInterval(updateDaysRemaining, 60000); // Atualiza a cada minuto

      return () => clearInterval(interval);
    } else if (
      subscription?.daysRemaining !== null &&
      subscription?.daysRemaining !== undefined
    ) {
      setDaysRemaining(subscription.daysRemaining);
    }
  }, [subscription?.trialEnd, subscription?.daysRemaining]);

  const memberships = mockStudentMemberships;
  const payments = mockStudentPayments;
  const paymentMethods = mockPaymentMethods;

  const pendingPayments = payments.filter(
    (p) => p.status === "pending" || p.status === "overdue"
  );
  const totalMonthly = memberships
    .filter((m) => m.status === "active")
    .reduce((sum, m) => sum + m.amount, 0);

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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao iniciar trial",
        description: error.message || "Erro ao iniciar trial. Tente novamente.",
      });
    }
  };

  const handleUpgrade = async (
    plan: string,
    billingPeriod: "monthly" | "annual"
  ) => {
    try {
      const result = await createSubscription(billingPeriod);

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar assinatura",
          description: result.error,
        });
        return;
      }

      if (result.billingUrl) {
        window.location.href = result.billingUrl;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar cobrança",
        description: error.message || "Erro ao criar cobrança",
      });
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    setShowCancelDialog(false);
    // O hook já faz o update otimista no Zustand e React Query antes de chamar o backend
    // A UI já está atualizada instantaneamente
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
      // O hook já invalida e refetch automaticamente no onSuccess
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar assinatura",
        description: error.message || "Erro ao cancelar assinatura",
      });
    }
  };

  const hasTrial =
    subscription?.trialEnd && new Date(subscription.trialEnd) > new Date();
  const isTrialActive =
    subscription &&
    subscription.plan === "premium" &&
    (subscription.status === "trialing" || hasTrial);
  const isPremiumActive =
    subscription?.plan === "premium" &&
    subscription.status === "active" &&
    !hasTrial;
  // Considerar que não há subscription apenas se não estiver carregando e realmente não houver subscription
  const hasNoSubscription =
    !isLoadingSubscription && !isStartingTrial && !subscription;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Pagamentos</h1>
        <p className="text-sm text-duo-gray-dark">
          Gerencie suas mensalidades e academias
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCardLarge
          icon={DollarSign}
          value={`R$ ${totalMonthly.toFixed(2)}`}
          label="Total mensal"
          iconColor="duo-green"
        />
        <StatCardLarge
          icon={AlertCircle}
          value={String(pendingPayments.length)}
          label="Pendentes"
          iconColor={pendingPayments.length > 0 ? "duo-orange" : "duo-blue"}
        />
      </div>

      <SectionCard title="Selecione a Categoria" icon={Wallet}>
        <OptionSelector
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={(value) => {
            const newTab = value as
              | "memberships"
              | "payments"
              | "methods"
              | "subscription";
            setActiveTab(newTab);
            setSubTab(value);
          }}
          layout="list"
          size="md"
          textAlign="center"
          animate={false}
        />
      </SectionCard>

      {activeTab === "memberships" && (
        <div className="space-y-3">
          {memberships.map((membership) => (
            <div key={membership.id}>
              <DuoCard variant="default" size="default">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-duo-green/20 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-duo-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-duo-text">
                      {membership.gymName}
                    </h3>
                    <p className="text-xs text-duo-gray-dark mt-0.5">
                      {membership.gymAddress}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold",
                          membership.status === "active" &&
                            "bg-duo-green/20 text-duo-green",
                          membership.status === "suspended" &&
                            "bg-duo-orange/20 text-duo-orange",
                          membership.status === "canceled" &&
                            "bg-duo-red/20 text-duo-red"
                        )}
                      >
                        {membership.status === "active" && "Ativo"}
                        {membership.status === "suspended" && "Suspenso"}
                        {membership.status === "canceled" && "Cancelado"}
                      </span>
                      {membership.autoRenew && (
                        <span className="px-2 py-1 bg-duo-blue/20 text-duo-blue rounded-lg text-xs font-bold">
                          Renovação automática
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t-2 border-duo-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-duo-gray-dark">
                            {membership.planName}
                          </p>
                          <p className="text-lg font-bold text-duo-green mt-0.5">
                            R$ {membership.amount.toFixed(2)}/mês
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-duo-gray-dark">
                            Próxima cobrança
                          </p>
                          <p className="text-sm font-bold text-duo-text mt-0.5">
                            {membership.nextBillingDate.toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {membership.paymentMethod && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-duo-gray-dark">
                        <CreditCard className="h-4 w-4" />
                        <span>
                          {membership.paymentMethod.brand} ••••{" "}
                          {membership.paymentMethod.last4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </DuoCard>
            </div>
          ))}

          <DuoCard
            variant="default"
            size="default"
            className="border-dashed cursor-pointer hover:border-duo-blue transition-colors"
          >
            <div className="flex items-center justify-center gap-2 py-2">
              <Plus className="h-5 w-5 text-duo-gray-dark" />
              <span className="font-bold text-duo-gray-dark">
                Adicionar nova academia
              </span>
            </div>
          </DuoCard>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id}>
              <DuoCard variant="default" size="default">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-duo-text">
                      {payment.gymName}
                    </h3>
                    <p className="text-xs text-duo-gray-dark mt-0.5">
                      {payment.planName}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1",
                          payment.status === "paid" &&
                            "bg-duo-green/20 text-duo-green",
                          payment.status === "pending" &&
                            "bg-duo-yellow/20 text-duo-yellow",
                          payment.status === "overdue" &&
                            "bg-duo-red/20 text-duo-red"
                        )}
                      >
                        {payment.status === "paid" && (
                          <>
                            <CheckCircle className="h-3 w-3" /> Pago
                          </>
                        )}
                        {payment.status === "pending" && (
                          <>
                            <AlertCircle className="h-3 w-3" /> Pendente
                          </>
                        )}
                        {payment.status === "overdue" && (
                          <>
                            <AlertCircle className="h-3 w-3" /> Atrasado
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t-2 border-duo-border flex items-center justify-between">
                      <div>
                        <p className="text-xs text-duo-gray-dark">Vencimento</p>
                        <p className="text-sm font-bold text-duo-text mt-0.5">
                          {payment.dueDate.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-duo-gray-dark">Valor</p>
                        <p className="text-lg font-bold text-duo-green mt-0.5">
                          R$ {payment.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {payment.status === "pending" && (
                      <Button className="w-full mt-3" size="sm">
                        Pagar agora
                      </Button>
                    )}
                  </div>
                </div>
              </DuoCard>
            </div>
          ))}
        </div>
      )}

      {activeTab === "methods" && (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id}>
              <DuoCard variant="default" size="default">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-duo-blue/20 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-duo-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-duo-text">
                        {method.cardBrand} •••• {method.last4}
                      </h3>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-duo-green/20 text-duo-green rounded text-xs font-bold">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-duo-gray-dark mt-1">
                      {method.type === "credit-card"
                        ? "Cartão de Crédito"
                        : "Cartão de Débito"}
                    </p>
                    {method.expiryMonth && method.expiryYear && (
                      <p className="text-xs text-duo-gray-dark mt-1">
                        Validade: {String(method.expiryMonth).padStart(2, "0")}/
                        {method.expiryYear}
                      </p>
                    )}
                  </div>
                </div>
              </DuoCard>
            </div>
          ))}

          <DuoCard
            variant="default"
            size="default"
            className="border-dashed cursor-pointer hover:border-duo-blue transition-colors"
          >
            <div className="flex items-center justify-center gap-2 py-2">
              <Plus className="h-5 w-5 text-duo-gray-dark" />
              <span className="font-bold text-duo-gray-dark">
                Adicionar método de pagamento
              </span>
            </div>
          </DuoCard>
        </div>
      )}

      {activeTab === "subscription" && (
        <SubscriptionSection
          userType="student"
          subscription={subscription}
          isLoading={isLoading}
          isStartingTrial={isStartingTrial}
          isCreatingSubscription={isCreatingSubscription}
          isCancelingSubscription={isCancelingSubscription}
          onStartTrial={handleStartTrial}
          onSubscribe={handleUpgrade}
          onCancel={handleCancelConfirm}
          plans={[
            {
              id: "premium",
              name: "Premium",
              monthlyPrice: 29.9,
              annualPrice: 299.0,
              features: [
                "Gerador de treinos com IA",
                "Gerador de dietas com IA",
                "Análise de postura avançada",
                "Coach pessoal virtual",
                "Consultoria nutricional",
                "Relatórios avançados",
              ],
            },
          ]}
          showPlansWhen="always"
        />
      )}

      <SubscriptionCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelConfirm}
        isTrial={!!isTrialActive}
        isLoading={isCancelingSubscription}
      />
    </div>
  );
}
