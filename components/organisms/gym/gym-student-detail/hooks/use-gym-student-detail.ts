"use client";

import { useCallback, useEffect, useState } from "react";
import { useGym } from "@/hooks/use-gym";
import type {
	DailyNutrition,
	Payment,
	PlanSlotData,
	StudentData,
	WeeklyPlanData,
} from "@/lib/types";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export type StudentDetailTab =
	| "overview"
	| "workouts"
	| "diet"
	| "progress"
	| "records"
	| "payments";

export interface UseGymStudentDetailProps {
	student: StudentData | null;
	payments?: Payment[];
	onBack: () => void;
}

export function useGymStudentDetail({
	student,
	payments = [],
}: UseGymStudentDetailProps) {
	const actions = useGym("actions");
	const [studentPayments, setStudentPayments] = useState(payments);
	const [activeTab, setActiveTab] = useState<StudentDetailTab>("overview");
	const [membershipStatus, setMembershipStatus] = useState<
		"active" | "inactive" | "suspended" | "canceled"
	>(student?.membershipStatus ?? "inactive");

	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanData | null | undefined>(
		undefined,
	);
	const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition | null>(
		null,
	);
	const [nutritionDate, setNutritionDate] = useState(() =>
		new Date().toISOString().slice(0, 10),
	);
	const [isLoadingWeeklyPlan, setIsLoadingWeeklyPlan] = useState(false);
	const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);

	const fetchWeeklyPlan = useCallback(async () => {
		if (!student?.id) return;
		setIsLoadingWeeklyPlan(true);
		try {
			const res = await fetch(`/api/gym/students/${student.id}/weekly-plan`);
			const data = await res.json();
			if (data.success && data.weeklyPlan) {
				setWeeklyPlan(data.weeklyPlan);
			} else {
				setWeeklyPlan(null);
			}
		} catch {
			setWeeklyPlan(null);
		} finally {
			setIsLoadingWeeklyPlan(false);
		}
	}, [student?.id]);

	const fetchNutrition = useCallback(
		async (date?: string) => {
			if (!student?.id) return;
			const d = date ?? nutritionDate;
			setIsLoadingNutrition(true);
			try {
				const res = await fetch(
					`/api/gym/students/${student.id}/nutrition?date=${d}`,
				);
				const data = await res.json();
				if (data.success) {
					setDailyNutrition({
						date: data.date,
						meals: data.meals ?? [],
						totalCalories: data.totalCalories ?? 0,
						totalProtein: data.totalProtein ?? 0,
						totalCarbs: data.totalCarbs ?? 0,
						totalFats: data.totalFats ?? 0,
						waterIntake: data.waterIntake ?? 0,
						targetCalories: data.targetCalories ?? 2000,
						targetProtein: data.targetProtein ?? 150,
						targetCarbs: data.targetCarbs ?? 250,
						targetFats: data.targetFats ?? 65,
						targetWater: data.targetWater ?? 3000,
					});
				} else {
					setDailyNutrition(null);
				}
			} catch {
				setDailyNutrition(null);
			} finally {
				setIsLoadingNutrition(false);
			}
		},
		[student?.id, nutritionDate],
	);

	useEffect(() => {
		if (activeTab === "workouts" && student?.id) {
			fetchWeeklyPlan();
		}
	}, [activeTab, student?.id, fetchWeeklyPlan]);

	useEffect(() => {
		if (activeTab === "diet" && student?.id) {
			fetchNutrition();
		}
	}, [activeTab, student?.id, fetchNutrition]);

	const handleMembershipAction = async (
		action: "suspended" | "canceled" | "active",
	) => {
		const membershipId = student?.gymMembership?.id;
		if (!membershipId) return;
		setIsUpdatingStatus(true);
		try {
			await actions.updateMemberStatus(membershipId, action);
			setMembershipStatus(action);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const togglePaymentStatus = async (paymentId: string) => {
		const payment = studentPayments.find((p) => p.id === paymentId);
		if (!payment) return;

		const newStatus = payment.status === "paid" ? "pending" : "paid";

		setStudentPayments((prev) =>
			prev.map((p) =>
				p.id === paymentId
					? {
							...p,
							status: newStatus,
							date: newStatus === "paid" ? new Date() : p.date,
						}
					: p,
			),
		);

		try {
			await actions.updatePaymentStatus(paymentId, newStatus);
		} catch {
			setStudentPayments((prev) =>
				prev.map((p) => (p.id === paymentId ? payment : p)),
			);
		}
	};

	const tabOptions = [
		{ value: "overview", label: "Visão Geral", emoji: "📊" },
		{ value: "workouts", label: "Treinos", emoji: "💪" },
		{ value: "diet", label: "Dieta", emoji: "🍎" },
		{ value: "progress", label: "Progresso", emoji: "📈" },
		{ value: "records", label: "Recordes", emoji: "🏆" },
		{ value: "payments", label: "Pagamentos", emoji: "💳" },
	];

	return {
		student,
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
		DAY_NAMES,
	};
}

export type { PlanSlotData };
