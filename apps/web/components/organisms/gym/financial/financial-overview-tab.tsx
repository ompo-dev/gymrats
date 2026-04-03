"use client";

import {
  Banknote,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import {
  DuoAlert,
  DuoButton,
  DuoCard,
  DuoInput,
  DuoStatCard,
  DuoStatsGrid,
} from "@/components/duo";
import { useGym } from "@/hooks/use-gym";
import { useToast } from "@/hooks/use-toast";
import type { FinancialSummary, Payment } from "@/lib/types";
import {
  formatCurrencyBR,
  formatCurrencyInput,
  parseCurrencyBR,
} from "@/lib/utils/currency";
import { formatDatePtBr } from "@/lib/utils/date-safe";

interface WithdrawItem {
  id: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  externalId: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
}

interface FinancialOverviewTabProps {
  financialSummary: FinancialSummary;
  payments?: Payment[];
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: Date;
  } | null;
  balanceReais?: number;
  balanceCents?: number;
  withdraws?: WithdrawItem[];
  fakeWithdraw?: boolean;
  showWithdraw?: boolean;
  disableWithdraw?: boolean;
}

interface FinancialOverviewActions {
  createWithdraw: (payload: {
    amountCents: number;
    fake?: boolean;
  }) => Promise<unknown>;
}

interface FinancialOverviewTabContentProps extends FinancialOverviewTabProps {
  actions?: FinancialOverviewActions;
}

function FinancialOverviewTabContent({
  financialSummary,
  payments = [],
  subscription,
  balanceReais = 0,
  balanceCents = 0,
  withdraws = [],
  fakeWithdraw = true,
  showWithdraw = true,
  disableWithdraw = false,
  actions,
}: FinancialOverviewTabContentProps) {
  const { toast } = useToast();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    const reais = parseCurrencyBR(withdrawAmount);
    if (reais < 3.5) {
      toast({ variant: "destructive", title: "Valor mínimo: R$ 3,50" });
      return;
    }
    const amountCents = Math.floor(reais * 100);
    if (amountCents > balanceCents) {
      toast({ variant: "destructive", title: "Saldo insuficiente" });
      return;
    }

    setIsWithdrawing(true);
    try {
      await actions?.createWithdraw({
        amountCents,
        fake: fakeWithdraw,
      });
      toast({
        title: fakeWithdraw ? "Saque simulado" : "Saque solicitado",
        description: fakeWithdraw
          ? "Em modo dev o valor foi registrado localmente. Em produção o PIX será processado."
          : `R$ ${reais.toFixed(2)} enviado para sua chave PIX.`,
      });
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: error instanceof Error ? error.message : "Erro ao criar saque",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      {subscription?.status === "past_due" && (
        <DuoAlert variant="danger" title="Assinatura Atrasada">
          A assinatura da Nutrifit para esta academia está atrasada. Regularize
          para evitar a suspensão do acesso.
        </DuoAlert>
      )}

      {subscription?.status === "canceled" && (
        <DuoAlert variant="warning" title="Assinatura Cancelada">
          A assinatura desta academia foi cancelada. O acesso está limitado ao
          plano Free.
        </DuoAlert>
      )}

      {(financialSummary.overduePayments ?? 0) > 0 && (
        <DuoAlert variant="danger" title="Mensalidades Atrasadas">
          {payments.filter((payment) => payment.status === "overdue").length}{" "}
          pagamento(s) atrasado(s) de alunos, totalizando{" "}
          {formatCurrencyBR(financialSummary.overduePayments)}.
        </DuoAlert>
      )}

      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Wallet
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">Saldo disponível</h2>
          </div>
          {showWithdraw && (
            <DuoButton
              size="sm"
              onClick={
                disableWithdraw ? undefined : () => setWithdrawModalOpen(true)
              }
              disabled={!disableWithdraw && balanceCents < 350}
            >
              <Banknote className="h-4 w-4" />
              Sacar
            </DuoButton>
          )}
        </DuoCard.Header>
        <div className="text-2xl font-bold text-duo-green">
          {formatCurrencyBR(balanceReais)}
        </div>
        {showWithdraw && balanceCents < 350 && (
          <p className="text-xs text-duo-gray-dark">
            Mínimo para saque: R$ 3,50
          </p>
        )}
        {showWithdraw && !disableWithdraw && fakeWithdraw && (
          <p className="mt-2 text-xs text-duo-orange">
            Modo dev: saques são simulados (sem transferência real).
          </p>
        )}
      </DuoCard.Root>

      {showWithdraw && !disableWithdraw && withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fechar modal de saque"
            className="absolute inset-0 bg-black/60"
            onClick={() => setWithdrawModalOpen(false)}
          />
          <DuoCard.Root className="relative z-10 w-full max-w-sm">
            <DuoCard.Header>
              <h3 className="font-bold">Sacar</h3>
            </DuoCard.Header>
            <div className="space-y-3">
              <DuoInput.Simple
                label="Valor (R$)"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={withdrawAmount}
                onChange={(event) =>
                  setWithdrawAmount(formatCurrencyInput(event.target.value))
                }
              />
              <p className="text-xs text-duo-gray-dark">
                Disponível: {formatCurrencyBR(balanceReais)} • Mín. R$ 3,50
              </p>
              <div className="flex gap-2">
                <DuoButton
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setWithdrawModalOpen(false)}
                >
                  Cancelar
                </DuoButton>
                <DuoButton
                  className="flex-1"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? "Processando..." : "Sacar"}
                </DuoButton>
              </div>
            </div>
          </DuoCard.Root>
        </div>
      )}

      {withdraws.length > 0 && (
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h2 className="font-bold text-[var(--duo-fg)]">Saques</h2>
          </DuoCard.Header>
          <div className="space-y-2">
            {withdraws.map((withdraw) => (
              <div
                key={withdraw.id}
                className="flex items-center justify-between rounded-lg border border-duo-border p-3"
              >
                <div>
                  <p className="font-bold text-duo-text">
                    {formatCurrencyBR(withdraw.amount)}
                  </p>
                  <p className="text-xs text-duo-gray-dark">
                    {formatDatePtBr(withdraw.createdAt)} •{" "}
                    {withdraw.status === "complete" ||
                    withdraw.status === "completed"
                      ? "Concluído"
                      : withdraw.status}
                  </p>
                </div>
                <span className="text-xs text-duo-gray-dark">
                  {withdraw.pixKeyType} •••{String(withdraw.pixKey).slice(-4)}
                </span>
              </div>
            ))}
          </div>
        </DuoCard.Root>
      )}

      <DuoStatsGrid.Root columns={2} className="gap-3">
        <DuoStatCard.Simple
          icon={TrendingUp}
          value={formatCurrencyBR(financialSummary.totalRevenue)}
          label="Receita Total"
          badge={`+${financialSummary.revenueGrowth}%`}
          iconColor="var(--duo-primary)"
        />
        <DuoStatCard.Simple
          icon={TrendingDown}
          value={formatCurrencyBR(financialSummary.totalExpenses)}
          label="Despesas"
          badge="Mensal"
          iconColor="var(--duo-danger)"
        />
        <DuoStatCard.Simple
          icon={DollarSign}
          value={formatCurrencyBR(financialSummary.netProfit)}
          label="Lucro Líquido"
          iconColor="var(--duo-secondary)"
        />
        <DuoStatCard.Simple
          icon={CreditCard}
          value={formatCurrencyBR(financialSummary.monthlyRecurring)}
          label="Recorrente Mensal"
          badge="MRR"
          iconColor="#A560E8"
        />
      </DuoStatsGrid.Root>

      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <DollarSign
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">Métricas do Mês</h2>
          </div>
        </DuoCard.Header>
        <div className="space-y-3">
          <DuoCard.Root variant="default" size="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-duo-gray-dark">Ticket Médio</span>
              <span className="text-sm font-bold text-duo-text">
                {formatCurrencyBR(financialSummary.averageTicket)}
              </span>
            </div>
          </DuoCard.Root>
          <DuoCard.Root variant="default" size="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-duo-gray-dark">Taxa de Churn</span>
              <span className="text-sm font-bold text-duo-red">
                {financialSummary.churnRate ?? 0}%
              </span>
            </div>
          </DuoCard.Root>
          <DuoCard.Root variant="default" size="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-duo-gray-dark">
                Pagamentos Pendentes
              </span>
              <span className="text-sm font-bold text-duo-yellow">
                {formatCurrencyBR(financialSummary.pendingPayments)}
              </span>
            </div>
          </DuoCard.Root>
        </div>
      </DuoCard.Root>
    </div>
  );
}

function GymFinancialOverviewTab(props: FinancialOverviewTabProps) {
  const actions = useGym("actions");
  return <FinancialOverviewTabContent {...props} actions={actions} />;
}

export function FinancialOverviewTab(props: FinancialOverviewTabProps) {
  if (!props.showWithdraw) {
    return <FinancialOverviewTabContent {...props} />;
  }

  return <GymFinancialOverviewTab {...props} />;
}
