"use client";

import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StudentMembershipPixModal } from "@/app/student/components/student-membership-pix-modal";
import { DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { SubscriptionCancelDialog } from "@/components/organisms/modals/subscription-cancel-dialog";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";
import type { StudentGymMembership, StudentPayment } from "@/lib/types";
import { MembershipCard, PaymentCard, PaymentsTabSelector, StudentReferralTab } from "./components";
import {
  type UsePaymentsPageProps,
  usePaymentsPage,
} from "./hooks/use-payments-page";

export interface StudentPaymentsPageProps {
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    trialStart: Date | null;
    trialEnd: Date | null;
    isTrial: boolean;
    daysRemaining: number | null;
    source?: "OWN" | "GYM_ENTERPRISE";
    enterpriseGymName?: string;
  } | null;
  startTrial?: () => Promise<{ error?: string; success?: boolean }>;
}

export function StudentPaymentsPage(props: StudentPaymentsPageProps = {}) {
  const {
    activeTab,
    subscription,
    memberships,
    payments,
    pendingPayments,
    totalMonthly,
    availablePlans,
    isLoading,
    isLoadingPayments,
    isStartingTrial,
    isCreatingSubscription,
    isCancelingSubscription,
    isTrialActive,
    expandedMembershipId,
    setExpandedMembershipId,
    changePlanPlans,
    changePlanMembershipId,
    setChangePlanPlans,
    setChangePlanMembershipId,
    pixModal,
    setPixModal,
    cancelDialogModal,
    setTab,
    setTabChange,
    handleCancelMembership,
    handleTrocarPlanoClick,
    handleSelectChangePlan,
    handlePixConfirmed,
    handlePayNowClick,
    handleStartTrial,
    handleUpgrade,
    handleCancelConfirm,
  } = usePaymentsPage(props as UsePaymentsPageProps);

  const [expandedGymIdMemberships, setExpandedGymIdMemberships] = useState<
    string | null
  >(null);
  const [expandedGymIdPayments, setExpandedGymIdPayments] = useState<
    string | null
  >(null);

  type GymMembershipGroup = {
    gymId: string;
    gymName: string;
    gymAddress?: string;
    memberships: StudentGymMembership[];
  };
  const membershipsByGym = useMemo((): GymMembershipGroup[] => {
    const list = Array.isArray(memberships) ? memberships : [];
    const map = new Map<string, GymMembershipGroup>();
    for (const m of list) {
      const key = m.gymId;
      if (!map.has(key)) {
        map.set(key, {
          gymId: m.gymId,
          gymName: m.gymName,
          gymAddress: m.gymAddress,
          memberships: [],
        });
      }
      map.get(key)?.memberships.push(m);
    }
    const result = Array.from(map.values());
    result.sort((a, b) => {
      const aMax = Math.max(
        ...a.memberships.map((x: StudentGymMembership) =>
          new Date(x.nextBillingDate ?? x.startDate).getTime(),
        ),
      );
      const bMax = Math.max(
        ...b.memberships.map((x: StudentGymMembership) =>
          new Date(x.nextBillingDate ?? x.startDate).getTime(),
        ),
      );
      return bMax - aMax;
    });
    return result;
  }, [memberships]);

  const paymentsByGym = useMemo(() => {
    const list = Array.isArray(payments) ? payments : [];
    const map = new Map<
      string,
      { gymId: string; gymName: string; payments: StudentPayment[] }
    >();
    for (const p of list) {
      const key = p.gymId;
      if (!map.has(key)) {
        map.set(key, { gymId: p.gymId, gymName: p.gymName, payments: [] });
      }
      map.get(key)?.payments.push(p);
    }
    const result = Array.from(map.values()).map((g) => ({
      ...g,
      payments: [...g.payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    }));
    result.sort((a, b) => {
      const aMax = Math.max(
        ...a.payments.map((x) => new Date(x.date).getTime()),
      );
      const bMax = Math.max(
        ...b.payments.map((x) => new Date(x.date).getTime()),
      );
      return bMax - aMax;
    });
    return result;
  }, [payments]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Pagamentos</h1>
        <p className="text-sm text-duo-gray-dark">
          Gerencie suas mensalidades e academias
        </p>
      </div>

      <DuoStatsGrid.Root columns={2}>
        <DuoStatCard.Simple
          icon={DollarSign}
          value={`R$ ${totalMonthly.toFixed(2)}`}
          label="Total mensal"
          iconColor="var(--duo-primary)"
        />
        <DuoStatCard.Simple
          icon={AlertCircle}
          value={String((pendingPayments ?? []).length)}
          label="Pendentes"
          iconColor={
            (pendingPayments ?? []).length > 0
              ? "var(--duo-accent)"
              : "var(--duo-secondary)"
          }
        />
      </DuoStatsGrid.Root>

      <PaymentsTabSelector activeTab={activeTab} onTabChange={setTabChange} />

      {activeTab === "memberships" && (
        <div className="space-y-3">
          {(membershipsByGym ?? []).map((group) => {
            const isExpanded = expandedGymIdMemberships === group.gymId;
            return (
              <DuoCard.Root key={group.gymId} variant="default" size="default">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left"
                  onClick={() =>
                    setExpandedGymIdMemberships(isExpanded ? null : group.gymId)
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
                      {group.gymName}
                    </div>
                    <div className="text-xs text-duo-gray-dark">
                      {group.memberships.length} plano(s) nesta academia
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t border-duo-border pt-3">
                    {group.memberships.map(
                      (membership: StudentGymMembership) => (
                        <MembershipCard
                          key={membership.id}
                          membership={membership}
                          isExpanded={expandedMembershipId === membership.id}
                          isChangePlanSelecting={
                            changePlanMembershipId === membership.id
                          }
                          changePlanPlans={changePlanPlans}
                          onToggleExpand={() =>
                            setExpandedMembershipId(
                              expandedMembershipId === membership.id
                                ? null
                                : membership.id,
                            )
                          }
                          onTrocarPlano={() =>
                            handleTrocarPlanoClick(membership)
                          }
                          onSelectChangePlan={handleSelectChangePlan}
                          onCancelChangePlan={() => {
                            setChangePlanPlans([]);
                            setChangePlanMembershipId(null);
                          }}
                          onCancelMembership={() =>
                            handleCancelMembership(membership.id)
                          }
                        />
                      ),
                    )}
                  </div>
                )}
              </DuoCard.Root>
            );
          })}

          <DuoCard.Root
            variant="default"
            size="default"
            className="border-dashed cursor-pointer hover:border-duo-blue transition-colors"
            onClick={() => void setTab("gyms")}
          >
            <div className="flex items-center justify-center gap-2 py-2">
              <Plus className="h-5 w-5 text-duo-gray-dark" />
              <span className="font-bold text-duo-gray-dark">
                Adicionar nova academia
              </span>
            </div>
          </DuoCard.Root>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="space-y-3">
          {isLoadingPayments ? (
            <div className="text-center py-8 text-duo-gray-dark">
              Carregando pagamentos...
            </div>
          ) : (paymentsByGym ?? []).length === 0 ? (
            <div className="text-center py-8 text-duo-gray-dark">
              Nenhum pagamento encontrado
            </div>
          ) : (
            (paymentsByGym ?? []).map((group) => {
              const isExpanded = expandedGymIdPayments === group.gymId;
              const totalPaid = group.payments.reduce(
                (s, p) => s + (p.status === "paid" ? p.amount : 0),
                0,
              );
              return (
                <DuoCard.Root
                  key={group.gymId}
                  variant="default"
                  size="default"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 text-left"
                    onClick={() =>
                      setExpandedGymIdPayments(isExpanded ? null : group.gymId)
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
                        {group.gymName}
                      </div>
                      <div className="text-xs text-duo-gray-dark">
                        {group.payments.length} pagamento(s) • Total pago: R${" "}
                        {totalPaid.toFixed(2)}
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-t border-duo-border pt-3">
                      {group.payments.map((payment: StudentPayment) => (
                        <PaymentCard
                          key={payment.id}
                          payment={payment}
                          onPayNow={handlePayNowClick}
                        />
                      ))}
                    </div>
                  )}
                </DuoCard.Root>
              );
            })
          )}
        </div>
      )}

      {activeTab === "subscription" && (
        <SubscriptionSection.Simple
          userType="student"
          subscription={subscription}
          isLoading={isLoading}
          isStartingTrial={isStartingTrial}
          isCreatingSubscription={isCreatingSubscription}
          isCancelingSubscription={isCancelingSubscription}
          onStartTrial={handleStartTrial}
          onSubscribe={handleUpgrade}
          onCancel={handleCancelConfirm}
          plans={availablePlans}
          showPlansWhen="always"
        />
      )}

      {activeTab === "referrals" && (
        <StudentReferralTab />
      )}

      <SubscriptionCancelDialog.Simple
        open={cancelDialogModal.isOpen}
        onOpenChange={(open) => {
          if (open) cancelDialogModal.open();
          else cancelDialogModal.close();
        }}
        onConfirm={handleCancelConfirm}
        isTrial={!!isTrialActive}
        isLoading={isCancelingSubscription}
      />

      {pixModal && (
        <StudentMembershipPixModal
          isOpen={true}
          onClose={() => setPixModal(null)}
          paymentId={pixModal.paymentId}
          brCode={pixModal.brCode}
          brCodeBase64={pixModal.brCodeBase64}
          amount={pixModal.amount}
          onPaymentConfirmed={handlePixConfirmed}
        />
      )}
    </div>
  );
}
