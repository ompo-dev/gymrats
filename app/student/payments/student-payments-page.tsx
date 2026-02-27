"use client";

import { AlertCircle, DollarSign, Plus } from "lucide-react";
import { DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { SubscriptionCancelDialog } from "@/components/organisms/modals/subscription-cancel-dialog";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";
import { StudentMembershipPixModal } from "@/app/student/components/student-membership-pix-modal";
import {
	MembershipCard,
	PaymentCard,
	PaymentsTabSelector,
} from "./components";
import { usePaymentsPage } from "./hooks/use-payments-page";
import type { StudentGymMembership, StudentPayment } from "@/lib/types";

interface StudentPaymentsPageProps {
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
	} = usePaymentsPage(props);

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
					value={String(pendingPayments.length)}
					label="Pendentes"
					iconColor={
						pendingPayments.length > 0 ? "var(--duo-accent)" : "var(--duo-secondary)"
					}
				/>
			</DuoStatsGrid.Root>

			<PaymentsTabSelector activeTab={activeTab} onTabChange={setTabChange} />

			{activeTab === "memberships" && (
				<div className="space-y-3">
					{memberships.map((membership: StudentGymMembership) => (
						<div key={membership.id}>
							<MembershipCard
								membership={membership}
								isExpanded={expandedMembershipId === membership.id}
								isChangePlanSelecting={changePlanMembershipId === membership.id}
								changePlanPlans={changePlanPlans}
								onToggleExpand={() =>
									setExpandedMembershipId(
										expandedMembershipId === membership.id ? null : membership.id,
									)
								}
								onTrocarPlano={() => handleTrocarPlanoClick(membership)}
								onSelectChangePlan={handleSelectChangePlan}
								onCancelChangePlan={() => {
									setChangePlanPlans([]);
									setChangePlanMembershipId(null);
								}}
								onCancelMembership={() => handleCancelMembership(membership.id)}
							/>
						</div>
					))}

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
					) : payments.length === 0 ? (
						<div className="text-center py-8 text-duo-gray-dark">
							Nenhum pagamento encontrado
						</div>
					) : (
						payments.map((payment: StudentPayment) => (
							<div key={payment.id}>
								<PaymentCard
									payment={payment}
									onPayNow={handlePayNowClick}
								/>
							</div>
						))
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
