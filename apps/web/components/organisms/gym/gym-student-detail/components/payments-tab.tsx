"use client";

import { Building2, CalendarClock, DollarSign } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { Payment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDatePtBr } from "@/lib/utils/date-safe";

export interface PaymentsTabProps {
  payments: Payment[];
  onSettlePayment: (paymentId: string) => Promise<void> | void;
  settlingPaymentId?: string | null;
}

function formatAmount(value: number) {
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusTone(status?: Payment["operationalStatus"] | Payment["status"]) {
  switch (status) {
    case "up_to_date":
    case "paid":
      return "border-duo-green bg-duo-green/10 text-duo-green";
    case "grace":
      return "border-duo-blue bg-duo-blue/10 text-duo-blue";
    case "pending":
      return "border-duo-yellow bg-duo-yellow/10 text-duo-yellow";
    case "overdue":
    case "blocked":
      return "border-duo-red bg-duo-red/10 text-duo-red";
    default:
      return "border-duo-border bg-duo-bg-elevated text-duo-gray-dark";
  }
}

function getOperationalLabel(payment: Payment) {
  switch (payment.operationalStatus) {
    case "up_to_date":
      return "Em dia";
    case "grace":
      return "Na graça";
    case "pending":
      return "Pendente";
    case "overdue":
      return "Atrasado";
    case "blocked":
      return "Bloqueado";
    default:
      switch (payment.status) {
        case "paid":
          return "Pago";
        case "pending":
          return "Pendente";
        case "overdue":
          return "Atrasado";
        case "canceled":
          return "Cancelado";
        case "withdrawn":
          return "Sacado";
        default:
          return "Sem status";
      }
  }
}

function shouldShowSettle(payment: Payment) {
  return (
    payment.status === "pending" ||
    payment.status === "overdue" ||
    payment.operationalStatus === "blocked" ||
    payment.operationalStatus === "grace"
  );
}

export function PaymentsTab({
  payments,
  onSettlePayment,
  settlingPaymentId = null,
}: PaymentsTabProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <DollarSign
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-duo-fg">Pagamentos e acesso</h2>
        </div>
      </DuoCard.Header>

      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-duo-border p-8 text-center text-sm text-duo-gray-dark">
            Nenhum pagamento registrado para este aluno.
          </div>
        ) : null}

        {payments.map((payment) => (
          <DuoCard.Root key={payment.id} variant="default" padding="sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-duo-bg-elevated text-duo-primary">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-duo-text">
                      {payment.planName}
                    </p>
                    <p className="text-xs text-duo-gray-dark">
                      {payment.kind === "membership_renewal"
                        ? "Renovação"
                        : payment.kind === "membership_change_plan"
                          ? "Troca de plano"
                          : payment.kind === "manual_regularization"
                            ? "Regularização"
                            : "Cobrança de matrícula"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-duo-text md:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-duo-gray-dark" />
                    Vencimento: {formatDatePtBr(payment.dueDate) || "—"}
                  </p>
                  <p>Valor: {formatAmount(payment.amount)}</p>
                  <p>
                    Pagamento:{" "}
                    {payment.date ? formatDatePtBr(payment.date) : "Sem registro"}
                  </p>
                  <p>
                    Janela atual:{" "}
                    {payment.graceUntil
                      ? `até ${formatDatePtBr(payment.graceUntil)}`
                      : "sem tolerância"}
                  </p>
                </div>
              </div>

              <div className="flex min-w-[220px] flex-col items-end gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
                    getStatusTone(payment.operationalStatus ?? payment.status),
                  )}
                >
                  {getOperationalLabel(payment)}
                </span>
                <span className="text-xs text-duo-gray-dark">
                  Financeiro:{" "}
                  {payment.financialStatus === "paid"
                    ? "Pago"
                    : payment.financialStatus === "pending"
                      ? "Pendente"
                      : payment.financialStatus === "overdue"
                        ? "Atrasado"
                        : "Não aplicável"}
                </span>
                {shouldShowSettle(payment) ? (
                  <DuoButton
                    size="sm"
                    onClick={() => void onSettlePayment(payment.id)}
                    isLoading={settlingPaymentId === payment.id}
                  >
                    Deixar em dia
                  </DuoButton>
                ) : null}
              </div>
            </div>
          </DuoCard.Root>
        ))}
      </div>
    </DuoCard.Root>
  );
}
