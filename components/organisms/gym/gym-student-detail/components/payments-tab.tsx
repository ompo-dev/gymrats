"use client";

import {
  Building2,
  ChevronDown,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MembershipCard } from "@/app/student/_payments/components/membership-card";
import { DuoButton, DuoCard } from "@/components/duo";
import type { Payment, StudentGymMembership } from "@/lib/types";

export interface PaymentsTabProps {
  payments: Payment[];
  onTogglePaymentStatus: (paymentId: string) => void;
}

export function PaymentsTab({
  payments,
  onTogglePaymentStatus: _onTogglePaymentStatus,
}: PaymentsTabProps) {
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [expandedMembershipId, setExpandedMembershipId] = useState<string | null>(
    null,
  );
  const membershipsByPlan = useMemo(
    () =>
      payments.reduce<
        Array<{
          planId: string;
          planName: string;
          memberships: StudentGymMembership[];
        }>
      >((groups, payment) => {
        const planId = payment.planId || payment.planName;
        const existing = groups.find((g) => g.planId === planId);

        const mappedMembership: StudentGymMembership = {
          id: payment.id,
          gymId: "gym-student-detail",
          gymName: "Academia",
          gymAddress: "Vínculo no perfil do aluno",
          planId,
          planName: payment.planName,
          planType: "monthly",
          startDate: payment.date ? new Date(payment.date) : new Date(),
          nextBillingDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
          amount: payment.amount,
          status:
            payment.status === "paid"
              ? "active"
              : payment.status === "canceled"
                ? "canceled"
                : "pending",
          autoRenew: false,
          paymentMethod:
            payment.paymentMethod === "credit-card" ||
            payment.paymentMethod === "debit-card" ||
            payment.paymentMethod === "pix"
              ? {
                  type: payment.paymentMethod,
                }
              : undefined,
          benefits: [],
        };

        if (existing) {
          existing.memberships.push(mappedMembership);
        } else {
          groups.push({
            planId,
            planName: payment.planName,
            memberships: [mappedMembership],
          });
        }
        return groups;
      }, []),
    [payments],
  );

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <DollarSign
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-duo-fg">Histórico de Pagamentos</h2>
        </div>
      </DuoCard.Header>
      <div className="space-y-3">
        {membershipsByPlan.map((group) => {
          const isExpanded = expandedPlanId === group.planId;
          const totalPaidByPlan = group.memberships.reduce(
            (sum, m) => sum + (m.status === "active" ? m.amount : 0),
            0,
          );

          return (
            <DuoCard.Root key={group.planId} variant="default" size="default">
              <DuoButton
                type="button"
                variant="ghost"
                fullWidth
                className="flex items-center gap-2 justify-start text-left h-auto py-2"
                onClick={() =>
                  setExpandedPlanId(isExpanded ? null : group.planId)
                }
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-duo-gray-dark" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-duo-gray-dark" />
                )}
                <Building2 className="h-5 w-5 shrink-0 text-duo-gray-dark" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-duo-text truncate">
                    {group.planName}
                  </div>
                  <div className="text-xs text-duo-gray-dark">
                    {group.memberships.length} pagamento(s) • Total pago: R${" "}
                    {totalPaidByPlan.toFixed(2)}
                  </div>
                </div>
              </DuoButton>
              {isExpanded && (
                <div className="mt-3 space-y-3 border-t border-duo-border pt-3">
                  {group.memberships.map((membership) => (
                    <MembershipCard
                      key={membership.id}
                      membership={membership}
                      isExpanded={expandedMembershipId === membership.id}
                      readOnly
                      isChangePlanSelecting={false}
                      changePlanPlans={[]}
                      onToggleExpand={() =>
                        setExpandedMembershipId(
                          expandedMembershipId === membership.id
                            ? null
                            : membership.id,
                        )
                      }
                      onTrocarPlano={() => {}}
                      onSelectChangePlan={() => {}}
                      onCancelChangePlan={() => {}}
                      onCancelMembership={() => {}}
                    />
                  ))}
                </div>
              )}
            </DuoCard.Root>
          );
        })}
      </div>
    </DuoCard.Root>
  );
}
