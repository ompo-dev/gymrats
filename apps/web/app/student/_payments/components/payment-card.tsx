"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { StudentPayment } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PaymentCardProps {
  payment: StudentPayment;
  onPayNow: (payment: StudentPayment) => void;
}

export function PaymentCard({ payment, onPayNow }: PaymentCardProps) {
  const isPending =
    payment.status === "pending" || payment.status === "overdue";

  return (
    <DuoCard.Root variant="default" size="default">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2 justify-between w-full">
          <p className="text-xs text-duo-gray-dark mt-0.5">
            {payment.planName}
          </p>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1",
                payment.status === "paid" && "bg-duo-green/20 text-duo-green",
                payment.status === "withdrawn" &&
                  "bg-duo-blue/20 text-duo-blue",
                payment.status === "pending" &&
                  "bg-duo-yellow/20 text-duo-yellow",
                payment.status === "overdue" && "bg-duo-red/20 text-duo-red",
                payment.status === "canceled" &&
                  "bg-[var(--duo-bg-elevated)] text-duo-gray-dark",
              )}
            >
              {payment.status === "paid" && (
                <>
                  <CheckCircle className="h-3 w-3" /> Pago
                </>
              )}
              {payment.status === "withdrawn" && (
                <>
                  <CheckCircle className="h-3 w-3" /> Sacado
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
              {payment.status === "canceled" && (
                <>
                  <AlertCircle className="h-3 w-3" /> Cancelado
                </>
              )}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t-2 border-duo-border flex items-center justify-between">
            <div>
              <p className="text-xs text-duo-gray-dark">Vencimento</p>
              <p className="text-sm font-bold text-duo-text mt-0.5">
                {payment.dueDate
                  ? new Date(payment.dueDate).toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-duo-gray-dark">Valor</p>
              <p className="text-lg font-bold text-duo-green mt-0.5">
                R$ {payment.amount.toFixed(2)}
              </p>
            </div>
          </div>

          {isPending && (
            <DuoButton
              className="w-full mt-3"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPayNow(payment);
              }}
            >
              Pagar agora
            </DuoButton>
          )}
        </div>
      </div>
    </DuoCard.Root>
  );
}
