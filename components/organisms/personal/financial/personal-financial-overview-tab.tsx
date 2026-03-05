"use client";

import { Building2, Target, Users } from "lucide-react";
import { DuoAlert, DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";

interface PersonalSubscriptionDisplay {
  id: string;
  plan: string;
  status: string;
  basePrice?: number;
  effectivePrice?: number | null;
  discountPercent?: number | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
}

interface PersonalFinancialOverviewTabProps {
  stats: {
    gyms: number;
    students: number;
    studentsViaGym: number;
    independentStudents: number;
  };
  subscription?: PersonalSubscriptionDisplay | null;
}

export function PersonalFinancialOverviewTab({
  stats,
  subscription,
}: PersonalFinancialOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Alertas de Assinatura */}
      {subscription?.status === "past_due" && (
        <DuoAlert variant="danger" title="Assinatura Atrasada">
          Sua assinatura está atrasada. Regularize para evitar a suspensão do
          acesso.
        </DuoAlert>
      )}

      {subscription?.status === "canceled" && (
        <DuoAlert variant="warning" title="Assinatura Cancelada">
          Sua assinatura foi cancelada. O acesso está limitado ao plano Free.
        </DuoAlert>
      )}

      {/* Stats do Personal */}
      <DuoStatsGrid.Root columns={2} className="gap-3">
        <DuoStatCard.Simple
          icon={Building2}
          value={String(stats.gyms)}
          label="Academias"
          iconColor="var(--duo-primary)"
        />
        <DuoStatCard.Simple
          icon={Users}
          value={String(stats.students)}
          label="Alunos"
          iconColor="var(--duo-secondary)"
        />
        <DuoStatCard.Simple
          icon={Target}
          value={String(stats.studentsViaGym)}
          label="Via academia"
          iconColor="var(--duo-accent)"
        />
        <DuoStatCard.Simple
          icon={Users}
          value={String(stats.independentStudents)}
          label="Independentes"
          iconColor="#A560E8"
        />
      </DuoStatsGrid.Root>

      {/* Card de plano atual */}
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <h2 className="font-bold text-[var(--duo-fg)]">Plano atual</h2>
        </DuoCard.Header>
        {subscription ? (
          <div className="space-y-2">
            <p className="text-xl font-bold text-duo-text">
              {subscription.plan === "pro_ai" ? "Pro AI" : "Standard"}
            </p>
            <p className="text-sm text-duo-gray-dark">
              Status: {subscription.status}
            </p>
            {subscription.effectivePrice != null && (
              <p className="text-sm text-duo-text">
                Valor efetivo: R${" "}
                {Number(subscription.effectivePrice).toFixed(2)}/mês
                {subscription.discountPercent
                  ? ` (${subscription.discountPercent}% de desconto)`
                  : ""}
              </p>
            )}
            <p className="text-xs text-duo-gray-dark">
              Próximo vencimento:{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                "pt-BR",
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-duo-gray-dark">
            Nenhuma assinatura ativa. Use a aba Assinatura para contratar.
          </p>
        )}
      </DuoCard.Root>
    </div>
  );
}
