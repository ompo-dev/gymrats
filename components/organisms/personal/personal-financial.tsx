"use client";

import { Loader2 } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DuoButton, DuoCard, DuoSelect } from "@/components/duo";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PersonalSubscriptionDisplay {
  id: string;
  plan: string;
  status: string;
  basePrice?: number;
  effectivePrice?: number | null;
  discountPercent?: number | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
}

export interface PersonalFinancialPageProps {
  subscription: PersonalSubscriptionDisplay | null;
  onRefresh: () => Promise<void>;
}

const PLAN_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "pro_ai", label: "Pro AI" },
];

const BILLING_OPTIONS = [
  { value: "monthly", label: "Mensal" },
  { value: "annual", label: "Anual" },
];

export function PersonalFinancialPage({
  subscription,
  onRefresh,
}: PersonalFinancialPageProps) {
  const { toast } = useToast();
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("overview"),
  );
  const [plan, setPlan] = useState("standard");
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixModal, setPixModal] = useState<{
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
  } | null>(null);

  const handleSubscribe = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<{
        subscription: unknown;
        pix?: {
          pixId: string;
          brCode: string;
          brCodeBase64: string;
          amount: number;
          expiresAt: string;
        };
      }>("/api/personals/subscription", {
        plan: plan as "standard" | "pro_ai",
        billingPeriod: billingPeriod as "monthly" | "annual",
      });
      await onRefresh();
      const pix = res.data?.pix;
      if (pix?.brCode && pix?.brCodeBase64) {
        setPixModal({
          brCode: pix.brCode,
          brCodeBase64: pix.brCodeBase64,
          amount: pix.amount,
          expiresAt: pix.expiresAt,
        });
      } else {
        toast({
          title: "Assinatura atualizada",
          description: "Seu plano foi registrado.",
        });
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao contratar";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <DuoCard.Root>
        <h2 className="text-lg font-bold text-duo-fg">Finanças</h2>
        <p className="mt-1 text-sm text-duo-fg-muted">
          Assinatura e desconto por afiliação a academias Premium/Enterprise.
        </p>
      </DuoCard.Root>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSubTab("overview")}
          className={cn(
            "rounded-xl border-2 px-3 py-1.5 text-sm font-semibold",
            subTab === "overview"
              ? "border-duo-primary bg-duo-primary/10 text-duo-primary"
              : "border-duo-border text-duo-fg-muted hover:border-duo-fg-muted",
          )}
        >
          Resumo
        </button>
        <button
          type="button"
          onClick={() => setSubTab("subscription")}
          className={cn(
            "rounded-xl border-2 px-3 py-1.5 text-sm font-semibold",
            subTab === "subscription"
              ? "border-duo-primary bg-duo-primary/10 text-duo-primary"
              : "border-duo-border text-duo-fg-muted hover:border-duo-fg-muted",
          )}
        >
          Assinatura
        </button>
      </div>

      {subTab === "overview" && (
        <>
          {subscription ? (
            <DuoCard.Root>
              <p className="text-sm text-duo-fg-muted">Plano atual</p>
              <p className="text-xl font-bold text-duo-fg">
                {subscription.plan === "pro_ai" ? "Pro AI" : "Standard"}
              </p>
              <p className="mt-1 text-sm text-duo-fg-muted">
                Status: {subscription.status}
              </p>
              {subscription.effectivePrice != null && (
                <p className="mt-1 text-sm text-duo-fg">
                  Valor efetivo: R${" "}
                  {Number(subscription.effectivePrice).toFixed(2)}/mês
                  {subscription.discountPercent
                    ? ` (${subscription.discountPercent}% de desconto)`
                    : ""}
                </p>
              )}
              <p className="mt-1 text-xs text-duo-fg-muted">
                Próximo vencimento:{" "}
                {new Date(
                  subscription.currentPeriodEnd,
                ).toLocaleDateString("pt-BR")}
              </p>
            </DuoCard.Root>
          ) : (
            <DuoCard.Root>
              <p className="text-sm text-duo-fg-muted">
                Nenhuma assinatura ativa. Use a aba Assinatura para contratar.
              </p>
            </DuoCard.Root>
          )}
        </>
      )}

      {subTab === "subscription" && (
        <DuoCard.Root>
          <h3 className="font-semibold text-duo-fg">Plano</h3>
          <div className="mt-3 space-y-3">
            <DuoSelect.Simple
              label="Plano"
              value={plan}
              onChange={setPlan}
              options={PLAN_OPTIONS}
            />
            <DuoSelect.Simple
              label="Cobrança"
              value={billingPeriod}
              onChange={setBillingPeriod}
              options={BILLING_OPTIONS}
            />
            <DuoButton
              onClick={handleSubscribe}
              disabled={isSubmitting}
              variant="primary"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {subscription ? "Atualizar plano" : "Contratar"}
            </DuoButton>
          </div>
        </DuoCard.Root>
      )}

      {pixModal && (
        <PixQrModal
          isOpen={!!pixModal}
          onClose={() => setPixModal(null)}
          title="Pagamento PIX - Assinatura Personal"
          brCode={pixModal.brCode}
          brCodeBase64={pixModal.brCodeBase64}
          amount={pixModal.amount}
          expiresAt={pixModal.expiresAt}
          pollConfig={{
            type: "subscription",
            refetch: onRefresh,
            currentStatus: subscription?.status,
            initialStatus: "pending_payment",
            targetStatus: "active",
            intervalMs: 3000,
          }}
          onPaymentConfirmed={() => {
            setPixModal(null);
            onRefresh();
          }}
          paymentConfirmedToast={{
            title: "Pagamento confirmado!",
            description: "Sua assinatura foi ativada.",
          }}
        />
      )}
    </div>
  );
}
