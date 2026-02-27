"use client";

import { Activity, Flame, Target, Users } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import {
	DietTab,
	OverviewTab,
	PaymentsTab,
	ProgressTab,
	RecordsTab,
	StudentHeaderCard,
	StudentTabSelector,
	WorkoutsTab,
} from "./components";
import { useGymStudentDetail } from "./hooks/use-gym-student-detail";
import type { Payment, StudentData } from "@/lib/types";

interface GymStudentDetailProps {
	student: StudentData | null;
	payments?: Payment[];
	onBack: () => void;
}

export function GymStudentDetail({
	student,
	payments = [],
	onBack,
}: GymStudentDetailProps) {
	const {
		student: studentData,
		studentPayments,
		activeTab,
		setActiveTab,
		membershipStatus,
		isUpdatingStatus,
		weeklyPlan,
		dailyNutrition,
		nutritionDate,
		setNutritionDate,
		isLoadingWeeklyPlan,
		isLoadingNutrition,
		fetchNutrition,
		handleMembershipAction,
		togglePaymentStatus,
		tabOptions,
	} = useGymStudentDetail({ student, payments, onBack });

	if (!studentData) {
		return (
			<div className="mx-auto max-w-4xl space-y-6">
				<DuoCard.Root variant="default" size="default" className="p-12 text-center">
					<p className="text-xl font-bold text-duo-gray-dark">Aluno não encontrado</p>
					<DuoButton onClick={onBack} className="mt-4">
						Voltar para Alunos
					</DuoButton>
				</DuoCard.Root>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<FadeIn>
				<DuoButton variant="ghost" onClick={onBack} className="gap-2 font-bold">
					Voltar para Alunos
				</DuoButton>
			</FadeIn>

			<SlideIn delay={0.1}>
				<StudentHeaderCard
					student={studentData}
					membershipStatus={membershipStatus}
					isUpdatingStatus={isUpdatingStatus}
					onMembershipAction={handleMembershipAction}
				/>
			</SlideIn>

			<SlideIn delay={0.2}>
				<DuoStatsGrid.Root columns={4} className="gap-4">
					<DuoStatCard.Simple
						icon={Flame}
						value={String(studentData.currentStreak)}
						label="Sequência"
						iconColor="var(--duo-accent)"
					/>
					<DuoStatCard.Simple
						icon={Target}
						value={String(studentData.progress?.currentLevel ?? 1)}
						label="Nível"
						iconColor="var(--duo-secondary)"
					/>
					<DuoStatCard.Simple
						icon={Activity}
						value={String(studentData.totalVisits)}
						label="Treinos"
						iconColor="var(--duo-primary)"
					/>
					<DuoStatCard.Simple
						icon={Users}
						value={`${studentData.attendanceRate}%`}
						label="Frequência"
						iconColor="#A560E8"
					/>
				</DuoStatsGrid.Root>
			</SlideIn>

			<SlideIn delay={0.3}>
				<StudentTabSelector
					activeTab={activeTab}
					onTabChange={setActiveTab}
					tabOptions={tabOptions}
				/>
			</SlideIn>

			{activeTab === "overview" && (
				<SlideIn delay={0.4}>
					<OverviewTab student={studentData} />
				</SlideIn>
			)}

			{activeTab === "workouts" && (
				<SlideIn delay={0.4}>
					<WorkoutsTab
						student={studentData}
						weeklyPlan={weeklyPlan}
						isLoadingWeeklyPlan={isLoadingWeeklyPlan}
					/>
				</SlideIn>
			)}

			{activeTab === "diet" && (
				<SlideIn delay={0.4}>
					<DietTab
						student={studentData}
						dailyNutrition={dailyNutrition}
						nutritionDate={nutritionDate}
						isLoadingNutrition={isLoadingNutrition}
						onNutritionDateChange={setNutritionDate}
						onFetchNutrition={fetchNutrition}
					/>
				</SlideIn>
			)}

			{activeTab === "progress" && (
				<SlideIn delay={0.4}>
					<ProgressTab student={studentData} />
				</SlideIn>
			)}

			{activeTab === "records" && (
				<SlideIn delay={0.4}>
					<RecordsTab student={studentData} />
				</SlideIn>
			)}

			{activeTab === "payments" && (
				<SlideIn delay={0.4}>
					<PaymentsTab
						payments={studentPayments}
						onTogglePaymentStatus={togglePaymentStatus}
					/>
				</SlideIn>
			)}
		</div>
	);
}
