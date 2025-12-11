"use client";

import { useState } from "react";
import {
  Crown,
  Gift,
  Sparkles,
  CheckCircle,
  CreditCard,
  Wallet,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  perStudentPrice?: number; // Preço por aluno/mês (apenas para gym, plano mensal)
}

export interface SubscriptionSectionProps {
  // Tipo de usuário
  userType: "student" | "gym";

  // Estado da subscription
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
    activeStudents?: number;
    totalAmount?: number;
  } | null;

  // Estados de loading
  isLoading?: boolean;
  isStartingTrial?: boolean;
  isCreatingSubscription?: boolean;
  isCancelingSubscription?: boolean;

  // Callbacks
  onStartTrial: () => Promise<void>;
  onSubscribe: (
    plan: string,
    billingPeriod: "monthly" | "annual"
  ) => Promise<void>;
  onCancel: () => Promise<void>;

  // Configurações de planos
  plans: SubscriptionPlan[];

  // Textos customizáveis
  texts?: {
    trialTitle?: string;
    trialDescription?: string;
    trialButton?: string;
    trialDaysRemaining?: string;
    trialValidUntil?: string;
    subscriptionStatusTitle?: string;
    upgradeTitle?: string;
    choosePlanTitle?: string;
    subscribeButton?: string;
    cancelTrialButton?: string;
    cancelSubscriptionButton?: string;
    nextRenewal?: string;
    monthlyLabel?: string;
    annualLabel?: string;
    saveLabel?: string;
    perMonth?: string;
    perYear?: string;
  };

  // Configurações de exibição
  showPlansWhen?:
    | "always"
    | "no-subscription"
    | "trial-active"
    | "trial-ending";
  trialEndingDays?: number;
}

export function SubscriptionSection({
  userType,
  subscription,
  isLoading = false,
  isStartingTrial = false,
  isCreatingSubscription = false,
  isCancelingSubscription = false,
  onStartTrial,
  onSubscribe,
  onCancel,
  plans,
  texts = {},
  showPlansWhen = "no-subscription",
  trialEndingDays = 3,
}: SubscriptionSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(
    plans.find((p) => p.id === "premium")?.id || plans[0]?.id || ""
  );
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<
    "monthly" | "annual"
  >("monthly");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "pix" | "credit-card" | "debit-card"
  >("pix");
  const [couponCode, setCouponCode] = useState("");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Textos padrão
  const defaultTexts = {
    trialTitle: "Experimente 14 dias grátis!",
    trialDescription: "Teste todas as funcionalidades Premium sem compromisso",
    trialButton: "Iniciar Trial Grátis",
    trialDaysRemaining: "dias restantes",
    trialValidUntil: "Válido até",
    subscriptionStatusTitle: "Status da Assinatura",
    upgradeTitle: "Fazer Upgrade para Premium",
    choosePlanTitle: "Escolha seu Plano",
    subscribeButton: "Assinar Agora",
    cancelTrialButton: "Cancelar Trial",
    cancelSubscriptionButton: "Cancelar Assinatura",
    nextRenewal: "Próxima renovação",
    monthlyLabel: "Mensal",
    annualLabel: "Anual",
    saveLabel: "Economize",
    perMonth: "por mês",
    perYear: "por ano",
  };

  const finalTexts = { ...defaultTexts, ...texts };

  const isLoadingState =
    isLoading ||
    isStartingTrial ||
    isCreatingSubscription ||
    isCancelingSubscription;

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
  const hasNoSubscription = !isLoading && !isStartingTrial && !subscription;

  const daysRemaining = subscription?.daysRemaining ?? null;
  const isTrialEnding =
    isTrialActive && daysRemaining !== null && daysRemaining <= trialEndingDays;

  // Determinar quando mostrar os planos
  // IMPORTANTE: Não mostrar planos quando trial está ativo (a menos que seja explicitamente solicitado)
  const shouldShowPlans = (() => {
    // Se há trial ativo e não é para mostrar durante trial, não mostrar
    if (
      isTrialActive &&
      showPlansWhen !== "trial-active" &&
      showPlansWhen !== "trial-ending"
    ) {
      return false;
    }

    switch (showPlansWhen) {
      case "always":
        return true;
      case "no-subscription":
        return hasNoSubscription;
      case "trial-active":
        return isTrialActive;
      case "trial-ending":
        return isTrialEnding;
      default:
        return hasNoSubscription;
    }
  })();

  const selectedPlanData = plans.find((p) => p.id === selectedPlan) || plans[0];
  const displayPrice =
    selectedBillingPeriod === "annual"
      ? selectedPlanData?.annualPrice
      : selectedPlanData?.monthlyPrice;

  // Calcular desconto anual baseado no plano
  const getAnnualDiscount = (planId: string): number => {
    const discounts: Record<string, number> = {
      basic: 5, // 5% desconto
      premium: 10, // 10% desconto
      enterprise: 15, // 15% desconto
    };
    return discounts[planId] || 10; // Default 10% se não encontrar
  };

  const annualDiscount = selectedPlanData
    ? getAnnualDiscount(selectedPlanData.id)
    : 10;

  const handleSubscribe = async () => {
    if (!selectedPlanData) return;
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlanData) return;

    // Validação para cartão
    if (
      (paymentMethod === "credit-card" || paymentMethod === "debit-card") &&
      (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv)
    ) {
      alert("Por favor, preencha todos os dados do cartão");
      return;
    }

    setIsProcessingPayment(true);
    try {
      await onSubscribe(selectedPlanData.id, selectedBillingPeriod);
      setShowPaymentModal(false);
      // Reset form
      setCardData({ number: "", name: "", expiry: "", cvv: "" });
      setCouponCode("");
      setPaymentMethod("pix");
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(" ") : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {(isLoading || isStartingTrial) && !subscription && (
        <DuoCard variant="default" size="default" className="text-center">
          <p className="text-sm text-duo-gray-dark">
            {isStartingTrial ? "Iniciando trial..." : "Carregando..."}
          </p>
        </DuoCard>
      )}

      {/* Trial Offer - Mostrar apenas se não há subscription */}
      {!isLoading && !isStartingTrial && hasNoSubscription && (
        <DuoCard variant="blue" size="default" className="text-center">
          <Gift className="mx-auto mb-4 h-16 w-16 text-duo-blue" />
          <h2 className="mb-2 text-2xl font-bold text-duo-text">
            {finalTexts.trialTitle}
          </h2>
          <p className="mb-6 text-sm text-duo-gray-dark">
            {finalTexts.trialDescription}
          </p>
          <Button
            onClick={onStartTrial}
            disabled={isLoadingState}
            className="w-full"
            size="lg"
          >
            {isLoadingState ? "Iniciando..." : finalTexts.trialButton}
          </Button>
          {isLoadingState && (
            <p className="mt-2 text-xs text-duo-gray-dark">
              Aguarde, estamos configurando seu trial...
            </p>
          )}
        </DuoCard>
      )}

      {/* Subscription Status */}
      {subscription && (
        <SectionCard title={finalTexts.subscriptionStatusTitle} icon={Crown}>
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
                  : "Free"}
              </span>
            </div>

            {/* Trial Info */}
            {hasTrial && (
              <>
                <DuoCard variant="blue" size="default">
                  <div className="flex items-center gap-3">
                    <Gift className="h-8 w-8 text-duo-blue" />
                    <div className="flex-1">
                      <h3 className="font-bold text-duo-text">
                        Trial Gratuito Ativo
                      </h3>
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
                          {daysRemaining === 1 ||
                          subscription.daysRemaining === 1
                            ? "dia restante"
                            : finalTexts.trialDaysRemaining}
                        </span>
                      </div>
                      <p className="text-xs text-duo-gray-dark mt-1">
                        Experimente todas as funcionalidades Premium
                      </p>
                      {subscription.trialEnd && (
                        <p className="text-xs text-duo-gray-dark mt-1">
                          {finalTexts.trialValidUntil}{" "}
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
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={isCancelingSubscription}
                  >
                    {isCancelingSubscription
                      ? "Cancelando..."
                      : finalTexts.cancelTrialButton}
                  </Button>
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
                        <p className="text-xs text-duo-gray-dark">
                          Alunos ativos
                        </p>
                        <p className="text-lg font-bold text-duo-text">
                          {subscription.activeStudents}
                        </p>
                      </div>
                      {subscription.totalAmount !== undefined && (
                        <div>
                          <p className="text-xs text-duo-gray-dark">
                            Valor mensal
                          </p>
                          <p className="text-lg font-bold text-duo-green">
                            R$ {subscription.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-duo-gray-dark">
                    {finalTexts.nextRenewal}
                  </span>
                  <span className="font-bold text-duo-text">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                </div>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full mt-3"
                  size="sm"
                  disabled={isCancelingSubscription}
                >
                  {isCancelingSubscription
                    ? "Cancelando..."
                    : finalTexts.cancelSubscriptionButton}
                </Button>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Plans Selector */}
      {shouldShowPlans && (
        <SectionCard
          title={
            isTrialActive ? finalTexts.upgradeTitle : finalTexts.choosePlanTitle
          }
          icon={Sparkles}
        >
          <div className="space-y-4">
            {/* Billing Period Selector */}
            <div className="grid grid-cols-2 gap-3">
              <DuoCard
                variant={
                  selectedBillingPeriod === "monthly"
                    ? "highlighted"
                    : "default"
                }
                size="md"
                className={cn(
                  "cursor-pointer transition-all",
                  selectedBillingPeriod === "monthly"
                    ? "border-duo-green bg-duo-green/10"
                    : "hover:border-duo-green/50"
                )}
                onClick={() => setSelectedBillingPeriod("monthly")}
              >
                <div className="mb-2 text-lg font-bold text-duo-text">
                  {finalTexts.monthlyLabel}
                </div>
                <div className="text-xs text-duo-gray-dark">
                  {finalTexts.perMonth}
                </div>
              </DuoCard>

              <DuoCard
                variant={
                  selectedBillingPeriod === "annual" ? "highlighted" : "default"
                }
                size="md"
                className={cn(
                  "cursor-pointer transition-all relative",
                  selectedBillingPeriod === "annual"
                    ? "border-duo-green bg-duo-green/10"
                    : "hover:border-duo-green/50"
                )}
                onClick={() => setSelectedBillingPeriod("annual")}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
                  Economize {annualDiscount}%
                </span>
                <div className="mb-2 text-lg font-bold text-duo-text">
                  {finalTexts.annualLabel}
                </div>
                <div className="text-xs text-duo-gray-dark">
                  {finalTexts.perYear}
                </div>
              </DuoCard>
            </div>

            {/* Plan Cards */}
            {plans.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const planPrice =
                    selectedBillingPeriod === "annual"
                      ? plan.annualPrice
                      : plan.monthlyPrice;

                  return (
                    <DuoCard
                      key={plan.id}
                      variant={isSelected ? "highlighted" : "default"}
                      size="md"
                      className={cn(
                        "cursor-pointer transition-all relative text-left",
                        isSelected
                          ? "border-duo-green bg-duo-green/10"
                          : "hover:border-duo-green/50"
                      )}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.id === "premium" && (
                        <span className="absolute -top-2 right-2 rounded-full bg-duo-yellow px-2 py-0.5 text-xs font-bold">
                          Popular
                        </span>
                      )}
                      <div className="mb-2 text-lg font-bold text-duo-text capitalize">
                        {plan.name}
                      </div>
                      <div className="mb-1 text-2xl font-bold text-duo-green">
                        R$ {Math.round(planPrice).toLocaleString("pt-BR")}
                      </div>
                      {selectedBillingPeriod === "annual" ? (
                        <div className="text-xs text-duo-gray-dark">
                          Preço fixo anual
                        </div>
                      ) : (
                        <div className="text-xs text-duo-gray-dark">
                          {finalTexts.perMonth}
                        </div>
                      )}
                      {selectedBillingPeriod === "monthly" &&
                        userType === "gym" &&
                        plan.perStudentPrice !== undefined && (
                          <div className="mt-1 text-xs text-duo-gray-dark">
                            + R${" "}
                            {plan.perStudentPrice.toLocaleString("pt-BR", {
                              minimumFractionDigits:
                                plan.perStudentPrice % 1 === 0 ? 0 : 2,
                              maximumFractionDigits: 2,
                            })}
                            /aluno
                          </div>
                        )}
                    </DuoCard>
                  );
                })}
              </div>
            )}

            {/* Features List */}
            {selectedPlanData && (
              <>
                <div className="space-y-2 pt-4 border-t-2 border-duo-border">
                  {selectedPlanData.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-duo-text"
                    >
                      <CheckCircle className="h-4 w-4 text-duo-green" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Subscribe Button */}
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoadingState}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isLoadingState
                    ? "Processando..."
                    : finalTexts.subscribeButton}
                </Button>
              </>
            )}
          </div>
        </SectionCard>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md border-2 border-duo-border bg-white p-0">
          <DialogHeader className="p-6 pb-4 border-b-2 border-duo-border">
            <DialogTitle className="text-2xl font-bold text-duo-text">
              Finalizar Assinatura
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Resumo do Plano */}
            <DuoCard variant="highlighted" size="default">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-duo-gray-dark">Plano</span>
                  <span className="font-bold text-duo-text capitalize">
                    {selectedPlanData?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-duo-gray-dark">Período</span>
                  <span className="font-bold text-duo-text">
                    {selectedBillingPeriod === "annual" ? "Anual" : "Mensal"}
                  </span>
                </div>
                <div className="pt-2 border-t-2 border-duo-border flex items-center justify-between">
                  <span className="text-base font-bold text-duo-text">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-duo-green">
                    R$ {Math.round(displayPrice || 0).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </DuoCard>

            {/* Método de Pagamento */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-duo-text">
                Método de Pagamento
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <DuoCard
                  variant={paymentMethod === "pix" ? "highlighted" : "default"}
                  size="md"
                  className={cn(
                    "cursor-pointer transition-all text-center",
                    paymentMethod === "pix"
                      ? "border-duo-green bg-duo-green/10"
                      : "hover:border-duo-green/50"
                  )}
                  onClick={() => setPaymentMethod("pix")}
                >
                  <QrCode className="mx-auto mb-2 h-8 w-8 text-duo-green" />
                  <div className="text-xs font-bold text-duo-text">PIX</div>
                </DuoCard>

                <DuoCard
                  variant={
                    paymentMethod === "credit-card" ? "highlighted" : "default"
                  }
                  size="md"
                  className={cn(
                    "cursor-pointer transition-all text-center",
                    paymentMethod === "credit-card"
                      ? "border-duo-green bg-duo-green/10"
                      : "hover:border-duo-green/50"
                  )}
                  onClick={() => setPaymentMethod("credit-card")}
                >
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-duo-blue" />
                  <div className="text-xs font-bold text-duo-text">Crédito</div>
                </DuoCard>

                <DuoCard
                  variant={
                    paymentMethod === "debit-card" ? "highlighted" : "default"
                  }
                  size="md"
                  className={cn(
                    "cursor-pointer transition-all text-center",
                    paymentMethod === "debit-card"
                      ? "border-duo-green bg-duo-green/10"
                      : "hover:border-duo-green/50"
                  )}
                  onClick={() => setPaymentMethod("debit-card")}
                >
                  <Wallet className="mx-auto mb-2 h-8 w-8 text-duo-purple" />
                  <div className="text-xs font-bold text-duo-text">Débito</div>
                </DuoCard>
              </div>
            </div>

            {/* Dados do Cartão (se selecionado) */}
            {(paymentMethod === "credit-card" ||
              paymentMethod === "debit-card") && (
              <div className="space-y-4 pt-2 border-t-2 border-duo-border">
                <div className="space-y-2">
                  <Label htmlFor="card-number" className="text-sm font-bold">
                    Número do Cartão
                  </Label>
                  <Input
                    id="card-number"
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={cardData.number}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      setCardData({ ...cardData, number: formatted });
                    }}
                    className="h-12 border-2 border-duo-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-name" className="text-sm font-bold">
                    Nome no Cartão
                  </Label>
                  <Input
                    id="card-name"
                    type="text"
                    placeholder="Nome completo"
                    value={cardData.name}
                    onChange={(e) =>
                      setCardData({ ...cardData, name: e.target.value })
                    }
                    className="h-12 border-2 border-duo-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="card-expiry" className="text-sm font-bold">
                      Validade
                    </Label>
                    <Input
                      id="card-expiry"
                      type="text"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={cardData.expiry}
                      onChange={(e) => {
                        const formatted = formatExpiry(e.target.value);
                        setCardData({ ...cardData, expiry: formatted });
                      }}
                      className="h-12 border-2 border-duo-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-cvv" className="text-sm font-bold">
                      CVV
                    </Label>
                    <Input
                      id="card-cvv"
                      type="text"
                      placeholder="000"
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          cvv: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="h-12 border-2 border-duo-border"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cupom de Desconto */}
            <div className="space-y-2 pt-2 border-t-2 border-duo-border">
              <Label htmlFor="coupon" className="text-sm font-bold">
                Cupom de Desconto (opcional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  type="text"
                  placeholder="Digite o código do cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-12 flex-1 border-2 border-duo-border"
                />
                <Button
                  variant="outline"
                  size="lg"
                  disabled={!couponCode.trim()}
                  onClick={() => {
                    // TODO: Validar cupom
                    alert("Cupom aplicado com sucesso!");
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 border-t-2 border-duo-border gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              disabled={isProcessingPayment}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              className="flex-1"
              size="lg"
            >
              {isProcessingPayment
                ? "Processando..."
                : paymentMethod === "pix"
                ? "Gerar QR Code PIX"
                : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
