"use client";

import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Plus,
} from "lucide-react";
import {
  DuoButton,
  DuoCard,
  DuoStatCard,
  DuoStatsGrid,
} from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { SubscriptionCancelDialog } from "@/components/organisms/modals/subscription-cancel-dialog";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";
import type { StudentGymMembership, StudentPayment } from "@/lib/types";
import type { SubscriptionData as StudentSubscriptionData } from "@/lib/types/student-unified";
import {
  MembershipCard,
  PaymentCard,
  PaymentsTabSelector,
  StudentReferralTab,
} from "@/app/student/_payments/components";

export type StudentPaymentsTab =
  | "memberships"
  | "payments"
  | "subscription"
  | "referrals";

export interface StudentMembershipGroup {
  gymId: string;
  gymName: string;
  gymAddress?: string;
  memberships: StudentGymMembership[];
}

export interface StudentPaymentGroup {
  gymId: string;
  gymName: string;
  payments: StudentPayment[];
}

export interface StudentPaymentsScreenProps
  extends ScreenProps<{
    activeTab: StudentPaymentsTab;
    subscription?: StudentSubscriptionData | null;
    membershipsByGym: StudentMembershipGroup[];
    paymentsByGym: StudentPaymentGroup[];
    pendingPayments: StudentPayment[];
    totalMonthly: number;
    availablePlans: Array<{
      id: string;
      name: string;
      monthlyPrice: number;
      annualPrice: number;
      features: string[];
    }>;
    isLoading: boolean;
    isLoadingPayments: boolean;
    isStartingTrial: boolean;
    isCreatingSubscription: boolean;
    isCancelingSubscription: boolean;
    isTrialActive: boolean;
    expandedMembershipId: string | null;
    expandedGymIdMemberships: string | null;
    expandedGymIdPayments: string | null;
    changePlanPlans: Array<{
      id: string;
      name: string;
      type: string;
      price: number;
      duration: number;
    }>;
    changePlanMembershipId: string | null;
    isFirstPayment: boolean;
    cancelDialogOpen: boolean;
    pixModal: {
      paymentId: string;
      brCode: string;
      brCodeBase64: string;
      amount: number;
      expiresAt?: string;
    } | null;
    subscriptionPixModal: {
      pixId: string;
      brCode: string;
      brCodeBase64: string;
      amount: number;
      expiresAt?: string;
      originalAmount?: number;
      canApplyReferral?: boolean;
    } | null;
    onExpandedMembershipIdChange: (membershipId: string | null) => void;
    onExpandedGymIdMembershipsChange: (gymId: string | null) => void;
    onExpandedGymIdPaymentsChange: (gymId: string | null) => void;
    onChangePlanPlansChange: (
      plans: Array<{
        id: string;
        name: string;
        type: string;
        price: number;
        duration: number;
      }>,
    ) => void;
    onChangePlanMembershipIdChange: (membershipId: string | null) => void;
    onCancelDialogOpenChange: (open: boolean) => void;
    onPixModalChange: (
      modal: {
        paymentId: string;
        brCode: string;
        brCodeBase64: string;
        amount: number;
        expiresAt?: string;
      } | null,
    ) => void;
    onSubscriptionPixModalChange: (
      modal: {
        pixId: string;
        brCode: string;
        brCodeBase64: string;
        amount: number;
        expiresAt?: string;
        originalAmount?: number;
        canApplyReferral?: boolean;
      } | null,
    ) => void;
    onNavigateToGyms: () => void | Promise<void>;
    onTabChange: (tab: StudentPaymentsTab) => void;
    onCancelMembership: (membershipId: string) => void | Promise<void>;
    onTrocarPlano: (
      membership: StudentGymMembership,
    ) => void | Promise<void>;
    onSelectChangePlan: (planId: string) => void | Promise<void>;
    onPixConfirmed: () => Promise<void>;
    onPayNow: (payment: StudentPayment) => void | Promise<void>;
    onCancelPayment: (paymentId: string) => void | Promise<void>;
    onStartTrial: () => Promise<void>;
    onUpgrade: (
      planId: string,
      billingPeriod: "monthly" | "annual",
      referralCode?: string | null,
    ) => Promise<void>;
    onApplyReferralStudent: (
      referralCode: string,
    ) => Promise<
      | {
          pixId: string;
          brCode: string;
          brCodeBase64: string;
          amount: number;
          expiresAt?: string;
        }
      | {
          error: string;
          referralCodeInvalid?: boolean;
        }
    >;
    checkSubscriptionIsActive: () => Promise<boolean>;
    onCancelConfirm: () => Promise<void>;
    getStudentPaymentStatus: (paymentId: string) => Promise<string>;
    refetchSubscription: () => Promise<unknown>;
  }> {}

export const studentPaymentsScreenContract: ViewContract = {
  componentId: "student-payments-screen",
  testId: "student-payments-screen",
};

export function StudentPaymentsScreen({
  activeTab,
  subscription,
  membershipsByGym,
  paymentsByGym,
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
  expandedGymIdMemberships,
  expandedGymIdPayments,
  changePlanPlans,
  changePlanMembershipId,
  isFirstPayment,
  cancelDialogOpen,
  pixModal,
  subscriptionPixModal,
  onExpandedMembershipIdChange,
  onExpandedGymIdMembershipsChange,
  onExpandedGymIdPaymentsChange,
  onChangePlanPlansChange,
  onChangePlanMembershipIdChange,
  onCancelDialogOpenChange,
  onPixModalChange,
  onSubscriptionPixModalChange,
  onNavigateToGyms,
  onTabChange,
  onCancelMembership,
  onTrocarPlano,
  onSelectChangePlan,
  onPixConfirmed,
  onPayNow,
  onCancelPayment,
  onStartTrial,
  onUpgrade,
  onApplyReferralStudent,
  checkSubscriptionIsActive,
  onCancelConfirm,
  getStudentPaymentStatus,
  refetchSubscription,
}: StudentPaymentsScreenProps) {
  return (
    <ScreenShell.Root
      screenId={studentPaymentsScreenContract.testId}
      className="max-w-4xl"
    >
      <ScreenShell.Header>
        <ScreenShell.Heading className="text-center sm:text-center">
          <ScreenShell.Title>Pagamentos</ScreenShell.Title>
          <ScreenShell.Description>
            Gerencie suas mensalidades, histórico e assinatura premium.
          </ScreenShell.Description>
        </ScreenShell.Heading>
      </ScreenShell.Header>

      <ScreenShell.Body>
        <DuoStatsGrid.Root
          columns={2}
          data-testid={createTestSelector(
            studentPaymentsScreenContract.testId,
            "metrics",
          )}
        >
          <DuoStatCard.Simple
            icon={DollarSign}
            value={`R$ ${totalMonthly.toFixed(2)}`}
            label="Total mensal"
            iconColor="var(--duo-primary)"
          />
          <DuoStatCard.Simple
            icon={AlertCircle}
            value={String(pendingPayments.length)}
            label="Pendentes"
            iconColor={
              pendingPayments.length > 0
                ? "var(--duo-accent)"
                : "var(--duo-secondary)"
            }
          />
        </DuoStatsGrid.Root>

        <PaymentsTabSelector
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        {activeTab === "memberships" ? (
          <div
            className="space-y-3"
            data-testid={createTestSelector(
              studentPaymentsScreenContract.testId,
              "memberships",
            )}
          >
            {membershipsByGym.map((group) => {
              const isExpanded = expandedGymIdMemberships === group.gymId;

              return (
                <DuoCard.Root key={group.gymId} variant="default" size="default">
                  <DuoButton
                    type="button"
                    variant="ghost"
                    fullWidth
                    className="flex h-auto items-center justify-start gap-2 py-2 text-left"
                    onClick={() =>
                      onExpandedGymIdMembershipsChange(
                        isExpanded ? null : group.gymId,
                      )
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-duo-gray-dark" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-duo-gray-dark" />
                    )}
                    <Building2 className="h-5 w-5 shrink-0 text-duo-gray-dark" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-duo-text">
                        {group.gymName}
                      </div>
                      <div className="text-xs text-duo-gray-dark">
                        {group.memberships.length} plano(s) nesta academia
                      </div>
                    </div>
                  </DuoButton>

                  {isExpanded ? (
                    <div className="mt-3 space-y-3 border-t border-duo-border pt-3">
                      {group.memberships.map((membership) => (
                        <MembershipCard
                          key={membership.id}
                          membership={membership}
                          isExpanded={expandedMembershipId === membership.id}
                          isChangePlanSelecting={
                            changePlanMembershipId === membership.id
                          }
                          changePlanPlans={changePlanPlans}
                          onToggleExpand={() =>
                            onExpandedMembershipIdChange(
                              expandedMembershipId === membership.id
                                ? null
                                : membership.id,
                            )
                          }
                          onTrocarPlano={() => onTrocarPlano(membership)}
                          onSelectChangePlan={onSelectChangePlan}
                          onCancelChangePlan={() => {
                            onChangePlanPlansChange([]);
                            onChangePlanMembershipIdChange(null);
                          }}
                          onCancelMembership={() =>
                            onCancelMembership(membership.id)
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                </DuoCard.Root>
              );
            })}

            <DuoCard.Root
              variant="default"
              size="default"
              className="cursor-pointer border-dashed transition-colors hover:border-duo-blue"
              onClick={() => void onNavigateToGyms()}
            >
              <div className="flex items-center justify-center gap-2 py-2">
                <Plus className="h-5 w-5 text-duo-gray-dark" />
                <span className="font-bold text-duo-gray-dark">
                  Adicionar nova academia
                </span>
              </div>
            </DuoCard.Root>
          </div>
        ) : null}

        {activeTab === "payments" ? (
          <div
            className="space-y-3"
            data-testid={createTestSelector(
              studentPaymentsScreenContract.testId,
              "payments",
            )}
          >
            {isLoadingPayments ? (
              <div className="py-8 text-center text-duo-gray-dark">
                Carregando pagamentos...
              </div>
            ) : paymentsByGym.length === 0 ? (
              <div className="py-8 text-center text-duo-gray-dark">
                Nenhum pagamento encontrado
              </div>
            ) : (
              paymentsByGym.map((group) => {
                const isExpanded = expandedGymIdPayments === group.gymId;
                const totalPaid = group.payments.reduce(
                  (sum, payment) =>
                    sum + (payment.status === "paid" ? payment.amount : 0),
                  0,
                );

                return (
                  <DuoCard.Root
                    key={group.gymId}
                    variant="default"
                    size="default"
                  >
                    <DuoButton
                      type="button"
                      variant="ghost"
                      fullWidth
                      className="flex h-auto items-center justify-start gap-2 py-2 text-left"
                      onClick={() =>
                        onExpandedGymIdPaymentsChange(
                          isExpanded ? null : group.gymId,
                        )
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-duo-gray-dark" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-duo-gray-dark" />
                      )}
                      <Building2 className="h-5 w-5 shrink-0 text-duo-gray-dark" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-duo-text">
                          {group.gymName}
                        </div>
                        <div className="text-xs text-duo-gray-dark">
                          {group.payments.length} pagamento(s) • Total pago: R${" "}
                          {totalPaid.toFixed(2)}
                        </div>
                      </div>
                    </DuoButton>

                    {isExpanded ? (
                      <div className="mt-3 space-y-2 border-t border-duo-border pt-3">
                        {group.payments.map((payment) => (
                          <PaymentCard
                            key={payment.id}
                            payment={payment}
                            onPayNow={onPayNow}
                          />
                        ))}
                      </div>
                    ) : null}
                  </DuoCard.Root>
                );
              })
            )}
          </div>
        ) : null}

        {activeTab === "subscription" ? (
          <div
            data-testid={createTestSelector(
              studentPaymentsScreenContract.testId,
              "subscription",
            )}
          >
            <SubscriptionSection.Simple
              userType="student"
              subscription={subscription}
              isLoading={isLoading}
              isStartingTrial={isStartingTrial}
              isCreatingSubscription={isCreatingSubscription}
              isCancelingSubscription={isCancelingSubscription}
              onStartTrial={onStartTrial}
              onSubscribe={onUpgrade}
              onCancel={onCancelConfirm}
              isFirstPayment={isFirstPayment}
              plans={availablePlans}
              showPlansWhen="always"
            />
          </div>
        ) : null}

        {activeTab === "referrals" ? (
          <div
            data-testid={createTestSelector(
              studentPaymentsScreenContract.testId,
              "referrals",
            )}
          >
            <StudentReferralTab />
          </div>
        ) : null}
      </ScreenShell.Body>

      <SubscriptionCancelDialog.Simple
        open={cancelDialogOpen}
        onOpenChange={onCancelDialogOpenChange}
        onConfirm={onCancelConfirm}
        isTrial={isTrialActive}
        isLoading={isCancelingSubscription}
      />

      {pixModal ? (
        <PixQrModal
          isOpen={true}
          onClose={() => onPixModalChange(null)}
          onCancelPayment={() => onCancelPayment(pixModal.paymentId)}
          brCode={pixModal.brCode}
          brCodeBase64={pixModal.brCodeBase64}
          amount={pixModal.amount}
          expiresAt={pixModal.expiresAt}
          valueSlot={undefined}
          simulatePixUrl={`/api/students/payments/${pixModal.paymentId}/simulate-pix`}
          onSimulateSuccess={onPixConfirmed}
          pollConfig={{
            type: "check",
            check: async () =>
              (await getStudentPaymentStatus(pixModal.paymentId)) === "paid",
          }}
          onPaymentConfirmed={onPixConfirmed}
          paymentConfirmedToast={{
            title: "Pagamento confirmado!",
            description: "Sua mensalidade está ativa.",
          }}
        />
      ) : null}

      {subscriptionPixModal ? (
        <PixQrModal
          isOpen={true}
          onClose={() => onSubscriptionPixModalChange(null)}
          brCode={subscriptionPixModal.brCode}
          brCodeBase64={subscriptionPixModal.brCodeBase64}
          amount={subscriptionPixModal.amount}
          expiresAt={subscriptionPixModal.expiresAt}
          referralSlot={
            subscriptionPixModal.canApplyReferral &&
            !subscriptionPixModal.originalAmount
              ? { onApplyReferral: onApplyReferralStudent }
              : undefined
          }
          valueSlot={
            subscriptionPixModal.originalAmount &&
            subscriptionPixModal.originalAmount > subscriptionPixModal.amount
              ? {
                  strikethrough: subscriptionPixModal.originalAmount,
                  badge: { code: "Indicação", discountString: "5%" },
                }
              : undefined
          }
          simulatePixUrl={`/api/subscriptions/simulate-pix?pixId=${encodeURIComponent(subscriptionPixModal.pixId)}`}
          onSimulateSuccess={() => refetchSubscription().then(() => undefined)}
          pollConfig={{
            type: "check",
            check: checkSubscriptionIsActive,
            intervalMs: 3000,
          }}
          onPaymentConfirmed={() => {
            onSubscriptionPixModalChange(null);
            void onPixConfirmed();
          }}
          paymentConfirmedToast={{
            title: "Pagamento confirmado!",
            description: "Sua assinatura está ativa.",
          }}
        />
      ) : null}
    </ScreenShell.Root>
  );
}
