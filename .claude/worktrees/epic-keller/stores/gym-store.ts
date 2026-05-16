import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockGymProfile, mockGymStats } from "@/lib/gym-mock-data";
import type {
	CheckIn,
	Coupon,
	Equipment,
	Expense,
	FinancialSummary,
	GymProfile,
	GymStats,
	MembershipPlan,
	Payment,
	Referral,
	StudentData,
} from "@/lib/types";

interface GymState {
	profile: GymProfile | null;
	stats: GymStats;
	students: StudentData[];
	equipment: Equipment[];
	checkIns: CheckIn[];
	membershipPlans: MembershipPlan[];
	payments: Payment[];
	coupons: Coupon[];
	referrals: Referral[];
	expenses: Expense[];
	financialSummary: FinancialSummary | null;
	setProfile: (profile: GymProfile) => void;
	setStats: (stats: GymStats) => void;
	setStudents: (students: StudentData[]) => void;
	addStudent: (student: StudentData) => void;
	updateStudent: (id: string, updates: Partial<StudentData>) => void;
	setEquipment: (equipment: Equipment[]) => void;
	updateEquipment: (id: string, updates: Partial<Equipment>) => void;
	addCheckIn: (checkIn: CheckIn) => void;
	setMembershipPlans: (plans: MembershipPlan[]) => void;
	addPayment: (payment: Payment) => void;
	addCoupon: (coupon: Coupon) => void;
	addReferral: (referral: Referral) => void;
	addExpense: (expense: Expense) => void;
	setFinancialSummary: (summary: FinancialSummary) => void;
}

export const useGymStore = create<GymState>()(
	persist(
		(set) => ({
			profile: mockGymProfile,
			stats: mockGymStats,
			students: [],
			equipment: [],
			checkIns: [],
			membershipPlans: [],
			payments: [],
			coupons: [],
			referrals: [],
			expenses: [],
			financialSummary: null,
			setProfile: (profile) => set({ profile }),
			setStats: (stats) => set({ stats }),
			setStudents: (students) => set({ students }),
			addStudent: (student) =>
				set((state) => ({
					students: [...state.students, student],
				})),
			updateStudent: (id, updates) =>
				set((state) => ({
					students: state.students.map((s) =>
						s.id === id ? { ...s, ...updates } : s,
					),
				})),
			setEquipment: (equipment) => set({ equipment }),
			updateEquipment: (id, updates) =>
				set((state) => ({
					equipment: state.equipment.map((e) =>
						e.id === id ? { ...e, ...updates } : e,
					),
				})),
			addCheckIn: (checkIn) =>
				set((state) => ({
					checkIns: [checkIn, ...state.checkIns],
				})),
			setMembershipPlans: (plans) => set({ membershipPlans: plans }),
			addPayment: (payment) =>
				set((state) => ({
					payments: [payment, ...state.payments],
				})),
			addCoupon: (coupon) =>
				set((state) => ({
					coupons: [...state.coupons, coupon],
				})),
			addReferral: (referral) =>
				set((state) => ({
					referrals: [...state.referrals, referral],
				})),
			addExpense: (expense) =>
				set((state) => ({
					expenses: [...state.expenses, expense],
				})),
			setFinancialSummary: (summary) => set({ financialSummary: summary }),
		}),
		{
			name: "gym-storage",
		},
	),
);
