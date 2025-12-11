"use client";

import type { FinancialSummary, Payment } from "@/lib/types";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { DuoCard } from "@/components/ui/duo-card";
import { SectionCard } from "@/components/ui/section-card";

interface FinancialOverviewTabProps {
  financialSummary: FinancialSummary;
  payments: Payment[];
}

export function FinancialOverviewTab({
  financialSummary,
  payments,
}: FinancialOverviewTabProps) {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR")}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCardLarge
          icon={TrendingUp}
          value={formatCurrency(financialSummary.totalRevenue)}
          label="Receita Total"
          subtitle={`+${financialSummary.revenueGrowth}%`}
          iconColor="duo-green"
        />
        <StatCardLarge
          icon={TrendingDown}
          value={formatCurrency(financialSummary.totalExpenses)}
          label="Despesas"
          subtitle="Mensal"
          iconColor="duo-red"
        />
        <StatCardLarge
          icon={DollarSign}
          value={formatCurrency(financialSummary.netProfit)}
          label="Lucro Líquido"
          iconColor="duo-blue"
        />
        <StatCardLarge
          icon={CreditCard}
          value={formatCurrency(financialSummary.monthlyRecurring)}
          label="Recorrente Mensal"
          subtitle="MRR"
          iconColor="duo-purple"
        />
      </div>

      {financialSummary.overduePayments > 0 && (
        <DuoCard
          variant="default"
          size="default"
          className="border-duo-red bg-duo-red/10"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-duo-red" />
            <div className="flex-1">
              <div className="text-sm font-bold text-duo-red">
                Pagamentos Atrasados
              </div>
              <div className="text-xs text-duo-red">
                {payments.filter((p) => p.status === "overdue").length}{" "}
                pagamento(s) atrasado(s) - R$ {financialSummary.overduePayments}
              </div>
            </div>
          </div>
        </DuoCard>
      )}

      <SectionCard title="Métricas do Mês" icon={DollarSign}>
        <div className="space-y-3">
          <DuoCard variant="default" size="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-duo-gray-dark">Ticket Médio</span>
              <span className="text-sm font-bold text-duo-text">
                R$ {financialSummary.averageTicket}
              </span>
            </div>
          </DuoCard>
          <DuoCard variant="default" size="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-duo-gray-dark">Taxa de Churn</span>
              <span className="text-sm font-bold text-duo-red">
                {financialSummary.churnRate}%
              </span>
            </div>
          </DuoCard>
          <DuoCard variant="default" size="sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-duo-gray-dark">
                Pagamentos Pendentes
              </span>
              <span className="text-sm font-bold text-duo-yellow">
                R$ {financialSummary.pendingPayments}
              </span>
            </div>
          </DuoCard>
        </div>
      </SectionCard>
    </div>
  );
}

