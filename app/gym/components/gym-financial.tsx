"use client";

import { useState } from "react";
import {
  mockFinancialSummary,
  mockPayments,
  mockCoupons,
  mockReferrals,
  mockExpenses,
} from "@/lib/gym-mock-data";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
  Gift,
  UsersIcon,
  Receipt,
  Plus,
} from "lucide-react";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function GymFinancialPage() {
  const [viewMode, setViewMode] = useState<
    "overview" | "payments" | "coupons" | "referrals" | "expenses"
  >("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-duo-green/20 text-duo-green border-duo-green";
      case "pending":
        return "bg-duo-yellow/20 text-duo-yellow border-duo-yellow";
      case "overdue":
        return "bg-duo-red/20 text-duo-red border-duo-red";
      default:
        return "bg-gray-50 text-duo-gray-dark border-duo-border";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Atrasado";
      default:
        return status;
    }
  };

  const tabOptions = [
    { value: "overview", label: "Resumo" },
    { value: "payments", label: "Pagamentos" },
    { value: "coupons", label: "Cupons" },
    { value: "referrals", label: "Indicações" },
    { value: "expenses", label: "Despesas" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Gestão Financeira
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Controle completo de receitas e despesas
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title="Selecione a Categoria" icon={DollarSign}>
          <OptionSelector
            options={tabOptions}
            value={viewMode}
            onChange={(value) =>
              setViewMode(
                value as
                  | "overview"
                  | "payments"
                  | "coupons"
                  | "referrals"
                  | "expenses"
              )
            }
            layout="list"
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      {viewMode === "overview" && (
        <>
          <SlideIn delay={0.2}>
            <div className="grid grid-cols-2 gap-4">
              <StatCardLarge
                icon={TrendingUp}
                value={`R$ ${mockFinancialSummary.totalRevenue.toLocaleString()}`}
                label="Receita Total"
                subtitle={`+${mockFinancialSummary.revenueGrowth}%`}
                iconColor="duo-green"
              />
              <StatCardLarge
                icon={TrendingDown}
                value={`R$ ${mockFinancialSummary.totalExpenses.toLocaleString()}`}
                label="Despesas"
                subtitle="Mensal"
                iconColor="duo-red"
              />
              <StatCardLarge
                icon={DollarSign}
                value={`R$ ${mockFinancialSummary.netProfit.toLocaleString()}`}
                label="Lucro Líquido"
                iconColor="duo-blue"
              />
              <StatCardLarge
                icon={CreditCard}
                value={`R$ ${mockFinancialSummary.monthlyRecurring.toLocaleString()}`}
                label="Recorrente Mensal"
                subtitle="MRR"
                iconColor="duo-purple"
              />
            </div>
          </SlideIn>

          {mockFinancialSummary.overduePayments > 0 && (
            <SlideIn delay={0.3}>
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
                      {
                        mockPayments.filter((p) => p.status === "overdue")
                          .length
                      }{" "}
                      pagamento(s) atrasado(s) - R${" "}
                      {mockFinancialSummary.overduePayments}
                    </div>
                  </div>
                </div>
              </DuoCard>
            </SlideIn>
          )}

          <SlideIn delay={0.4}>
            <SectionCard title="Métricas do Mês" icon={DollarSign}>
              <div className="space-y-3">
                {[
                  {
                    label: "Ticket Médio",
                    value: `R$ ${mockFinancialSummary.averageTicket}`,
                  },
                  {
                    label: "Taxa de Churn",
                    value: `${mockFinancialSummary.churnRate}%`,
                    color: "text-duo-red",
                  },
                  {
                    label: "Pagamentos Pendentes",
                    value: `R$ ${mockFinancialSummary.pendingPayments}`,
                    color: "text-duo-yellow",
                  },
                ].map((metric, index) => (
                  <DuoCard key={index} variant="default" size="sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-duo-gray-dark">
                        {metric.label}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-bold text-duo-text",
                          metric.color
                        )}
                      >
                        {metric.value}
                      </span>
                    </div>
                  </DuoCard>
                ))}
              </div>
            </SectionCard>
          </SlideIn>
        </>
      )}

      {viewMode === "payments" && (
        <SlideIn delay={0.2}>
          <SectionCard
            title="Pagamentos Recentes"
            icon={CreditCard}
            headerAction={
              <Button size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            }
          >
            <div className="space-y-3">
              {mockPayments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard variant="default" size="default">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-duo-text">
                          {payment.studentName}
                        </div>
                        <div className="text-xs text-duo-gray-dark">
                          {payment.planName}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "rounded-lg border-2 px-3 py-1 text-xs font-bold",
                          getStatusColor(payment.status)
                        )}
                      >
                        {getStatusLabel(payment.status)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-duo-gray-dark">Valor</div>
                        <div className="text-lg font-bold text-duo-green">
                          R$ {payment.amount}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-duo-gray-dark">
                          Vencimento
                        </div>
                        <div className="text-sm font-bold text-duo-text">
                          {payment.dueDate.toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  </DuoCard>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </SlideIn>
      )}

      {viewMode === "coupons" && (
        <SlideIn delay={0.2}>
          <SectionCard
            title="Cupons Ativos"
            icon={Gift}
            headerAction={
              <Button size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            }
          >
            <div className="space-y-3">
              {mockCoupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard
                    variant="yellow"
                    size="default"
                    className="border-duo-yellow bg-duo-yellow/10"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-duo-yellow" />
                        <div className="rounded-lg bg-duo-yellow/20 px-3 py-1 font-mono text-sm font-bold text-duo-yellow">
                          {coupon.code}
                        </div>
                      </div>
                      {coupon.isActive && (
                        <div className="rounded-lg bg-duo-green/20 px-2 py-1 text-xs font-bold text-duo-green">
                          Ativo
                        </div>
                      )}
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs text-duo-gray-dark">
                          Desconto
                        </div>
                        <div className="text-lg font-bold text-duo-yellow">
                          {coupon.type === "percentage"
                            ? `${coupon.value}%`
                            : `R$ ${coupon.value}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-duo-gray-dark">Usos</div>
                        <div className="text-sm font-bold text-duo-text">
                          {coupon.currentUses}/{coupon.maxUses}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-duo-gray-dark">
                          Validade
                        </div>
                        <div className="text-sm font-bold text-duo-text">
                          {coupon.expiryDate.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-duo-yellow"
                        style={{
                          width: `${
                            (coupon.currentUses / coupon.maxUses) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </DuoCard>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </SlideIn>
      )}

      {viewMode === "referrals" && (
        <SlideIn delay={0.2}>
          <SectionCard title="Programa de Indicações" icon={UsersIcon}>
            <div className="space-y-3">
              {mockReferrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard
                    variant="default"
                    size="default"
                    className="border-duo-purple bg-duo-purple/10"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-full bg-duo-purple/20 p-2">
                        <UsersIcon className="h-5 w-5 text-duo-purple" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-duo-text">
                          {referral.referrerName}
                        </div>
                        <div className="text-xs text-duo-gray-dark">
                          indicou {referral.referredName}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "rounded-lg px-3 py-1 text-xs font-bold",
                          referral.status === "completed"
                            ? "bg-duo-green/20 text-duo-green"
                            : "bg-duo-yellow/20 text-duo-yellow"
                        )}
                      >
                        {referral.status === "completed"
                          ? "Completo"
                          : "Pendente"}
                      </div>
                    </div>

                    <DuoCard variant="default" size="sm" className="bg-white">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-duo-gray-dark">
                          Recompensa
                        </div>
                        <div className="text-lg font-bold text-duo-purple">
                          R$ {referral.reward}
                        </div>
                      </div>
                    </DuoCard>
                  </DuoCard>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </SlideIn>
      )}

      {viewMode === "expenses" && (
        <SlideIn delay={0.2}>
          <SectionCard
            title="Despesas do Mês"
            icon={Receipt}
            headerAction={
              <Button size="sm" variant="destructive">
                <Plus className="h-4 w-4" />
              </Button>
            }
          >
            <div className="space-y-3">
              {mockExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard variant="default" size="default">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="mb-1 text-xs font-bold uppercase text-duo-gray-dark">
                          {expense.type}
                        </div>
                        <div className="text-sm font-bold text-duo-text">
                          {expense.description}
                        </div>
                        <div className="text-xs text-duo-gray-dark">
                          {expense.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-duo-red">
                          -R$ {expense.amount}
                        </div>
                        <div className="text-xs text-duo-gray-dark">
                          {expense.date.toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  </DuoCard>
                </motion.div>
              ))}
            </div>

            <DuoCard
              variant="default"
              size="default"
              className="mt-4 border-duo-red bg-duo-red/10"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-duo-gray-dark">
                  Total de Despesas
                </span>
                <span className="text-xl font-bold text-duo-red">
                  R${" "}
                  {mockExpenses
                    .reduce((sum, exp) => sum + exp.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
            </DuoCard>
          </SectionCard>
        </SlideIn>
      )}
    </div>
  );
}
