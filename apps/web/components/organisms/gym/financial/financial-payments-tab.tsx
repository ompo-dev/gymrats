"use client";

import { ChevronDown, ChevronRight, CreditCard } from "lucide-react";
import { useMemo, useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { Payment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDatePtBr } from "@/lib/utils/date-safe";

interface FinancialPaymentsTabProps {
  payments?: Payment[];
  onSettlePayment?: (paymentId: string) => Promise<void> | void;
  settlingPaymentId?: string | null;
}

function formatAmount(value: number) {
  return `R$ ${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getBadgeTone(status?: Payment["operationalStatus"] | Payment["status"]) {
  switch (status) {
    case "up_to_date":
    case "paid":
      return "bg-duo-green/20 text-duo-green border-duo-green";
    case "grace":
      return "bg-duo-blue/20 text-duo-blue border-duo-blue";
    case "pending":
      return "bg-duo-yellow/20 text-duo-yellow border-duo-yellow";
    case "overdue":
    case "blocked":
      return "bg-duo-red/20 text-duo-red border-duo-red";
    default:
      return "bg-gray-50 text-duo-gray-dark border-duo-border";
  }
}

function getBadgeLabel(payment: Payment) {
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
        case "withdrawn":
          return "Sacado";
        case "pending":
          return "Pendente";
        case "overdue":
          return "Atrasado";
        case "canceled":
          return "Cancelado";
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

type StudentPaymentGroup = {
  studentName: string;
  studentId: string;
  payments: Payment[];
};

export function FinancialPaymentsTab({
  payments = [],
  onSettlePayment,
  settlingPaymentId = null,
}: FinancialPaymentsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const byStudent = useMemo((): StudentPaymentGroup[] => {
    const map = new Map<string, StudentPaymentGroup>();
    for (const payment of payments) {
      const key = payment.studentId;
      if (!map.has(key)) {
        map.set(key, {
          studentName: payment.studentName,
          studentId: payment.studentId,
          payments: [],
        });
      }
      map.get(key)?.payments.push(payment);
    }

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        payments: [...group.payments].sort(
          (left, right) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
        ),
      }))
      .sort((left, right) => {
        const leftTime = left.payments[0]
          ? new Date(left.payments[0].date).getTime()
          : 0;
        const rightTime = right.payments[0]
          ? new Date(right.payments[0].date).getTime()
          : 0;
        return rightTime - leftTime;
      });
  }, [payments]);

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <CreditCard
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">
            Pagamentos por aluno
          </h2>
        </div>
      </DuoCard.Header>

      <div className="space-y-2">
        {byStudent.length === 0 ? (
          <p className="py-8 text-center text-sm text-duo-gray-dark">
            Nenhum pagamento registrado.
          </p>
        ) : null}

        {byStudent.map(({ studentId, studentName, payments: studentPayments }) => {
          const isExpanded = expandedId === studentId;
          const totalReceived = studentPayments.reduce(
            (sum, payment) =>
              sum +
              (payment.status === "paid" || payment.status === "withdrawn"
                ? payment.amount
                : 0),
            0,
          );
          const latestPayment = studentPayments[0];

          return (
            <DuoCard.Root key={studentId} variant="default" size="default">
              <button
                type="button"
                className="flex w-full items-center gap-2 text-left"
                onClick={() => setExpandedId(isExpanded ? null : studentId)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-duo-gray-dark" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-duo-gray-dark" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-duo-text">
                    {studentName}
                  </div>
                  <div className="text-xs text-duo-gray-dark">
                    {studentPayments.length} pagamento(s) • Total recebido:{" "}
                    {formatAmount(totalReceived)}
                  </div>
                </div>
                {latestPayment ? (
                  <div
                    className={cn(
                      "rounded-lg border px-2 py-1 text-xs font-medium shrink-0",
                      getBadgeTone(
                        latestPayment.operationalStatus ?? latestPayment.status,
                      ),
                    )}
                  >
                    {getBadgeLabel(latestPayment)}
                  </div>
                ) : null}
              </button>

              {isExpanded ? (
                <div className="mt-3 space-y-2 border-t border-duo-border pt-3">
                  {studentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-duo-border bg-duo-gray-lighter/30 p-3"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-duo-text">
                          {payment.planName}
                        </div>
                        <div className="text-xs text-duo-gray-dark">
                          Venc.: {formatDatePtBr(payment.dueDate) || "—"} • Pago:{" "}
                          {payment.date ? formatDatePtBr(payment.date) : "—"}
                        </div>
                        <div className="text-xs text-duo-gray-dark">
                          Operação: {getBadgeLabel(payment)}
                          {payment.graceUntil
                            ? ` • Graça até ${formatDatePtBr(payment.graceUntil)}`
                            : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-duo-green">
                          {formatAmount(payment.amount)}
                        </span>
                        <span
                          className={cn(
                            "rounded border px-2 py-0.5 text-xs font-medium",
                            getBadgeTone(
                              payment.operationalStatus ?? payment.status,
                            ),
                          )}
                        >
                          {getBadgeLabel(payment)}
                        </span>
                        {onSettlePayment && shouldShowSettle(payment) ? (
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
                  ))}
                </div>
              ) : null}
            </DuoCard.Root>
          );
        })}
      </div>
    </DuoCard.Root>
  );
}
