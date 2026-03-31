"use client";

import { useMemo, useState } from "react";
import { StudentPaymentsScreen } from "@/components/screens/student";
import type { StudentGymMembership, StudentPayment } from "@/lib/types";
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
    handleCancelPayment,
    handleStartTrial,
    handleUpgrade,
    handleApplyReferralStudent,
    checkSubscriptionIsActive,
    handleCancelConfirm,
    getStudentPaymentStatus,
    isFirstPayment,
    refetchSubscription,
    subscriptionPixModal,
    setSubscriptionPixModal,
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

    for (const membership of list) {
      const key = membership.gymId;

      if (!map.has(key)) {
        map.set(key, {
          gymId: membership.gymId,
          gymName: membership.gymName,
          gymAddress: membership.gymAddress,
          memberships: [],
        });
      }

      map.get(key)?.memberships.push(membership);
    }

    const result = Array.from(map.values());
    result.sort((a, b) => {
      const aMax = Math.max(
        ...a.memberships.map((membership: StudentGymMembership) =>
          new Date(membership.nextBillingDate ?? membership.startDate).getTime(),
        ),
      );
      const bMax = Math.max(
        ...b.memberships.map((membership: StudentGymMembership) =>
          new Date(membership.nextBillingDate ?? membership.startDate).getTime(),
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

    for (const payment of list) {
      const key = payment.gymId;

      if (!map.has(key)) {
        map.set(key, {
          gymId: payment.gymId,
          gymName: payment.gymName,
          payments: [],
        });
      }

      map.get(key)?.payments.push(payment);
    }

    const result = Array.from(map.values()).map((group) => ({
      ...group,
      payments: [...group.payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    }));

    result.sort((a, b) => {
      const aMax = Math.max(...a.payments.map((payment) => new Date(payment.date).getTime()));
      const bMax = Math.max(...b.payments.map((payment) => new Date(payment.date).getTime()));
      return bMax - aMax;
    });

    return result;
  }, [payments]);

  return (
    <StudentPaymentsScreen
      activeTab={activeTab}
      subscription={subscription}
      membershipsByGym={membershipsByGym}
      paymentsByGym={paymentsByGym}
      pendingPayments={pendingPayments}
      totalMonthly={totalMonthly}
      availablePlans={availablePlans}
      isLoading={isLoading}
      isLoadingPayments={isLoadingPayments}
      isStartingTrial={isStartingTrial}
      isCreatingSubscription={isCreatingSubscription}
      isCancelingSubscription={isCancelingSubscription}
      isTrialActive={Boolean(isTrialActive)}
      expandedMembershipId={expandedMembershipId}
      expandedGymIdMemberships={expandedGymIdMemberships}
      expandedGymIdPayments={expandedGymIdPayments}
      changePlanPlans={changePlanPlans}
      changePlanMembershipId={changePlanMembershipId}
      isFirstPayment={isFirstPayment}
      cancelDialogOpen={cancelDialogModal.isOpen}
      pixModal={pixModal}
      subscriptionPixModal={subscriptionPixModal}
      onExpandedMembershipIdChange={setExpandedMembershipId}
      onExpandedGymIdMembershipsChange={setExpandedGymIdMemberships}
      onExpandedGymIdPaymentsChange={setExpandedGymIdPayments}
      onChangePlanPlansChange={setChangePlanPlans}
      onChangePlanMembershipIdChange={setChangePlanMembershipId}
      onCancelDialogOpenChange={(open) => {
        if (open) {
          cancelDialogModal.open();
          return;
        }

        cancelDialogModal.close();
      }}
      onPixModalChange={setPixModal}
      onSubscriptionPixModalChange={setSubscriptionPixModal}
      onNavigateToGyms={() => void setTab("gyms")}
      onTabChange={setTabChange}
      onCancelMembership={handleCancelMembership}
      onTrocarPlano={handleTrocarPlanoClick}
      onSelectChangePlan={handleSelectChangePlan}
      onPixConfirmed={handlePixConfirmed}
      onPayNow={handlePayNowClick}
      onCancelPayment={handleCancelPayment}
      onStartTrial={handleStartTrial}
      onUpgrade={handleUpgrade}
      onApplyReferralStudent={handleApplyReferralStudent}
      checkSubscriptionIsActive={checkSubscriptionIsActive}
      onCancelConfirm={handleCancelConfirm}
      getStudentPaymentStatus={getStudentPaymentStatus}
      refetchSubscription={refetchSubscription}
    />
  );
}
