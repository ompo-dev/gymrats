"use client"

import { useState } from "react"
import { CreditCard, DollarSign, Calendar, CheckCircle, AlertCircle, Plus, Wallet, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StudentGymMembership, StudentPayment, PaymentMethod } from "@/lib/types"
import { mockStudentMemberships, mockStudentPayments, mockPaymentMethods } from "@/lib/mock-data"

export function StudentPaymentsPage() {
  const [activeTab, setActiveTab] = useState<"memberships" | "payments" | "methods">("memberships")
  const [memberships] = useState<StudentGymMembership[]>(mockStudentMemberships)
  const [payments] = useState<StudentPayment[]>(mockStudentPayments)
  const [paymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods)

  const pendingPayments = payments.filter((p) => p.status === "pending" || p.status === "overdue")
  const totalMonthly = memberships.filter((m) => m.status === "active").reduce((sum, m) => sum + m.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 px-4 py-6">
        <h1 className="text-2xl font-black text-gray-900">Pagamentos</h1>
        <p className="text-sm text-gray-600 mt-1">Gerencie suas mensalidades e academias</p>
      </div>

      {/* Summary Cards */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
          <DollarSign className="h-6 w-6 mb-2 opacity-90" />
          <div className="text-2xl font-black">R$ {totalMonthly.toFixed(2)}</div>
          <div className="text-xs opacity-90 mt-1">Total mensal</div>
        </div>
        <div
          className={cn(
            "rounded-2xl p-4 text-white",
            pendingPayments.length > 0
              ? "bg-gradient-to-br from-orange-500 to-orange-600"
              : "bg-gradient-to-br from-blue-500 to-blue-600",
          )}
        >
          <AlertCircle className="h-6 w-6 mb-2 opacity-90" />
          <div className="text-2xl font-black">{pendingPayments.length}</div>
          <div className="text-xs opacity-90 mt-1">Pendentes</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 grid grid-cols-3 gap-2">
        {[
          { id: "memberships", label: "Academias", icon: Building2 },
          { id: "payments", label: "Histórico", icon: Calendar },
          { id: "methods", label: "Métodos", icon: Wallet },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border-2",
              activeTab === tab.id
                ? "bg-duo-blue text-white border-duo-blue"
                : "bg-white text-gray-600 border-gray-200 hover:border-duo-blue",
            )}
          >
            <tab.icon className="h-5 w-5" />
            {activeTab === tab.id && <span className="text-xs font-bold">{tab.label}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {activeTab === "memberships" && (
          <>
            {memberships.map((membership) => (
              <div key={membership.id} className="bg-white rounded-2xl border-2 border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900">{membership.gymName}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{membership.gymAddress}</p>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold",
                          membership.status === "active" && "bg-green-100 text-green-700",
                          membership.status === "suspended" && "bg-orange-100 text-orange-700",
                          membership.status === "canceled" && "bg-red-100 text-red-700",
                        )}
                      >
                        {membership.status === "active" && "Ativo"}
                        {membership.status === "suspended" && "Suspenso"}
                        {membership.status === "canceled" && "Cancelado"}
                      </span>
                      {membership.autoRenew && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                          Renovação automática
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600">Plano {membership.planName}</p>
                          <p className="text-lg font-black text-green-600 mt-0.5">
                            R$ {membership.amount.toFixed(2)}/mês
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Próxima cobrança</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">
                            {membership.nextBillingDate.toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {membership.paymentMethod && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <CreditCard className="h-4 w-4" />
                        <span>
                          {membership.paymentMethod.brand} •••• {membership.paymentMethod.last4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-600 font-bold flex items-center justify-center gap-2 hover:border-duo-blue hover:text-duo-blue transition-colors">
              <Plus className="h-5 w-5" />
              Adicionar nova academia
            </button>
          </>
        )}

        {activeTab === "payments" && (
          <>
            {payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-2xl border-2 border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900">{payment.gymName}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{payment.planName}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1",
                          payment.status === "paid" && "bg-green-100 text-green-700",
                          payment.status === "pending" && "bg-yellow-100 text-yellow-700",
                          payment.status === "overdue" && "bg-red-100 text-red-700",
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

                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Vencimento</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {payment.dueDate.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Valor</p>
                        <p className="text-lg font-black text-green-600 mt-0.5">R$ {payment.amount.toFixed(2)}</p>
                      </div>
                    </div>

                    {payment.status === "pending" && (
                      <button className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors">
                        Pagar agora
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === "methods" && (
          <>
            {paymentMethods.map((method) => (
              <div key={method.id} className="bg-white rounded-2xl border-2 border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-900">
                        {method.cardBrand} •••• {method.last4}
                      </h3>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {method.type === "credit-card" ? "Cartão de Crédito" : "Cartão de Débito"}
                    </p>
                    {method.expiryMonth && method.expiryYear && (
                      <p className="text-xs text-gray-600 mt-1">
                        Validade: {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-600 font-bold flex items-center justify-center gap-2 hover:border-duo-blue hover:text-duo-blue transition-colors">
              <Plus className="h-5 w-5" />
              Adicionar método de pagamento
            </button>
          </>
        )}
      </div>
    </div>
  )
}
