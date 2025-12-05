"use client"

import { useState } from "react"
import { mockFinancialSummary, mockPayments, mockCoupons, mockReferrals, mockExpenses } from "@/lib/gym-mock-data"
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
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function FinancialPage() {
  const [viewMode, setViewMode] = useState<"overview" | "payments" | "coupons" | "referrals" | "expenses">("overview")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-50 text-green-600 border-green-200"
      case "pending":
        return "bg-yellow-50 text-yellow-600 border-yellow-200"
      case "overdue":
        return "bg-red-50 text-red-600 border-red-200"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago"
      case "pending":
        return "Pendente"
      case "overdue":
        return "Atrasado"
      default:
        return status
    }
  }

  return (
    <div className="container px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-black text-duo-gray-darkest">Gestão Financeira</h1>
          <p className="text-sm text-duo-gray-dark">Controle completo de receitas e despesas</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-5 gap-2">
          {[
            { id: "overview", label: "Resumo", icon: DollarSign },
            { id: "payments", label: "Pagamentos", icon: CreditCard },
            { id: "coupons", label: "Cupons", icon: Gift },
            { id: "referrals", label: "Indicações", icon: UsersIcon },
            { id: "expenses", label: "Despesas", icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = viewMode === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-bold transition-all ${
                  isActive ? "bg-[#FF9600] text-white shadow-md" : "bg-white text-duo-gray-dark hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {isActive && <span className="text-center leading-tight">{tab.label}</span>}
              </button>
            )
          })}
        </div>

        {/* Overview */}
        {viewMode === "overview" && (
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                    +{mockFinancialSummary.revenueGrowth}%
                  </div>
                </div>
                <div className="text-2xl font-black text-green-600">
                  R$ {mockFinancialSummary.totalRevenue.toLocaleString()}
                </div>
                <div className="text-xs font-bold text-duo-gray-dark">Receita Total</div>
              </div>

              <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <div className="text-xs font-bold text-duo-gray-dark">Mensal</div>
                </div>
                <div className="text-2xl font-black text-red-600">
                  R$ {mockFinancialSummary.totalExpenses.toLocaleString()}
                </div>
                <div className="text-xs font-bold text-duo-gray-dark">Despesas</div>
              </div>

              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  <div className="text-xs font-bold text-duo-gray-dark">Lucro</div>
                </div>
                <div className="text-2xl font-black text-blue-600">
                  R$ {mockFinancialSummary.netProfit.toLocaleString()}
                </div>
                <div className="text-xs font-bold text-duo-gray-dark">Lucro Líquido</div>
              </div>

              <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  <div className="text-xs font-bold text-duo-gray-dark">MRR</div>
                </div>
                <div className="text-2xl font-black text-purple-600">
                  R$ {mockFinancialSummary.monthlyRecurring.toLocaleString()}
                </div>
                <div className="text-xs font-bold text-duo-gray-dark">Recorrente Mensal</div>
              </div>
            </div>

            {/* Alertas */}
            {mockFinancialSummary.overduePayments > 0 && (
              <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <div className="flex-1">
                    <div className="text-sm font-black text-red-600">Pagamentos Atrasados</div>
                    <div className="text-xs text-red-600">
                      {mockPayments.filter((p) => p.status === "overdue").length} pagamento(s) atrasado(s) - R${" "}
                      {mockFinancialSummary.overduePayments}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Métricas Adicionais */}
            <div className="rounded-2xl border-2 border-duo-border bg-white p-5">
              <h3 className="mb-4 text-sm font-black text-duo-gray-darkest">Métricas do Mês</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-duo-gray-dark">Ticket Médio</span>
                  <span className="text-sm font-black text-duo-gray-darkest">
                    R$ {mockFinancialSummary.averageTicket}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-duo-gray-dark">Taxa de Churn</span>
                  <span className="text-sm font-black text-red-600">{mockFinancialSummary.churnRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-duo-gray-dark">Pagamentos Pendentes</span>
                  <span className="text-sm font-black text-yellow-600">R$ {mockFinancialSummary.pendingPayments}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments */}
        {viewMode === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-duo-gray-darkest">Pagamentos Recentes</h3>
              <button className="rounded-xl bg-duo-green p-2 hover:bg-duo-green/90">
                <Plus className="h-5 w-5 text-white" />
              </button>
            </div>

            {mockPayments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border-2 border-duo-border bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="text-sm font-black text-duo-gray-darkest">{payment.studentName}</div>
                    <div className="text-xs text-duo-gray-dark">{payment.planName}</div>
                  </div>
                  <div className={`rounded-lg border-2 px-3 py-1 text-xs font-bold ${getStatusColor(payment.status)}`}>
                    {getStatusLabel(payment.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-duo-gray-dark">Valor</div>
                    <div className="text-lg font-black text-duo-green">R$ {payment.amount}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-duo-gray-dark">Vencimento</div>
                    <div className="text-sm font-bold text-duo-gray-darkest">
                      {payment.dueDate.toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coupons */}
        {viewMode === "coupons" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-duo-gray-darkest">Cupons Ativos</h3>
              <button className="rounded-xl bg-duo-green p-2 hover:bg-duo-green/90">
                <Plus className="h-5 w-5 text-white" />
              </button>
            </div>

            {mockCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-yellow-600" />
                    <div className="rounded-lg bg-yellow-100 px-3 py-1 font-mono text-sm font-black text-yellow-700">
                      {coupon.code}
                    </div>
                  </div>
                  {coupon.isActive && (
                    <div className="rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-600">Ativo</div>
                  )}
                </div>

                <div className="mb-3 grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-duo-gray-dark">Desconto</div>
                    <div className="text-lg font-black text-yellow-600">
                      {coupon.type === "percentage" ? `${coupon.value}%` : `R$ ${coupon.value}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-duo-gray-dark">Usos</div>
                    <div className="text-sm font-bold text-duo-gray-darkest">
                      {coupon.currentUses}/{coupon.maxUses}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-duo-gray-dark">Validade</div>
                    <div className="text-sm font-bold text-duo-gray-darkest">
                      {coupon.expiryDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-yellow-500"
                    style={{ width: `${(coupon.currentUses / coupon.maxUses) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Referrals */}
        {viewMode === "referrals" && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-duo-gray-darkest">Programa de Indicações</h3>

            {mockReferrals.map((referral) => (
              <div
                key={referral.id}
                className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-2">
                    <UsersIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-duo-gray-darkest">{referral.referrerName}</div>
                    <div className="text-xs text-duo-gray-dark">indicou {referral.referredName}</div>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      referral.status === "completed" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {referral.status === "completed" ? "Completo" : "Pendente"}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white p-3">
                  <div className="text-xs text-duo-gray-dark">Recompensa</div>
                  <div className="text-lg font-black text-purple-600">R$ {referral.reward}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expenses */}
        {viewMode === "expenses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-duo-gray-darkest">Despesas do Mês</h3>
              <button className="rounded-xl bg-red-500 p-2 hover:bg-red-600">
                <Plus className="h-5 w-5 text-white" />
              </button>
            </div>

            {mockExpenses.map((expense) => (
              <div key={expense.id} className="rounded-2xl border-2 border-duo-border bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="mb-1 text-xs font-bold uppercase text-duo-gray-dark">{expense.type}</div>
                    <div className="text-sm font-black text-duo-gray-darkest">{expense.description}</div>
                    <div className="text-xs text-duo-gray-dark">{expense.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-red-600">-R$ {expense.amount}</div>
                    <div className="text-xs text-duo-gray-dark">{expense.date.toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-duo-gray-dark">Total de Despesas</span>
                <span className="text-xl font-black text-red-600">
                  R$ {mockExpenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
