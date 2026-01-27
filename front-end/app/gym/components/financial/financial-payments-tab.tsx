"use client";

import type { Payment } from "@/lib/types";
import { CreditCard, Plus } from "lucide-react";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { Button } from "@/components/atoms/buttons/button";
import { cn } from "@/lib/utils";

interface FinancialPaymentsTabProps {
  payments: Payment[];
}

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

export function FinancialPaymentsTab({
  payments,
}: FinancialPaymentsTabProps) {
  return (
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
        {payments.map((payment) => (
          <DuoCard key={payment.id} variant="default" size="default">
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
                <div className="text-xs text-duo-gray-dark">Vencimento</div>
                <div className="text-sm font-bold text-duo-text">
                  {payment.dueDate.toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          </DuoCard>
        ))}
      </div>
    </SectionCard>
  );
}

