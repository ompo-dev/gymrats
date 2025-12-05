"use client";

import { useState } from "react";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Wallet,
  Building2,
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
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";

export function StudentPaymentsPage() {
  const [activeTab, setActiveTab] = useState<
    "memberships" | "payments" | "methods"
  >("memberships");
  const [memberships] = useState<StudentGymMembership[]>(
    mockStudentMemberships
  );
  const [payments] = useState<StudentPayment[]>(mockStudentPayments);
  const [paymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);

  const pendingPayments = payments.filter(
    (p) => p.status === "pending" || p.status === "overdue"
  );
  const totalMonthly = memberships
    .filter((m) => m.status === "active")
    .reduce((sum, m) => sum + m.amount, 0);

  const tabOptions = [
    { value: "memberships", label: "Academias", emoji: "🏢" },
    { value: "payments", label: "Histórico", emoji: "📅" },
    { value: "methods", label: "Métodos", emoji: "💳" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">Pagamentos</h1>
          <p className="text-sm text-duo-gray-dark">
            Gerencie suas mensalidades e academias
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
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
      </SlideIn>

      <SlideIn delay={0.2}>
        <SectionCard title="Selecione a Categoria" icon={Wallet}>
          <OptionSelector
            options={tabOptions}
            value={activeTab}
            onChange={(value) =>
              setActiveTab(value as "memberships" | "payments" | "methods")
            }
            layout="list"
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.3}>
        {activeTab === "memberships" && (
          <div className="space-y-3">
            {memberships.map((membership, index) => (
              <motion.div
                key={membership.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
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
              </motion.div>
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
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
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
                          <p className="text-xs text-duo-gray-dark">
                            Vencimento
                          </p>
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
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "methods" && (
          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
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
                          Validade:{" "}
                          {String(method.expiryMonth).padStart(2, "0")}/
                          {method.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>
                </DuoCard>
              </motion.div>
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
      </SlideIn>
    </div>
  );
}
