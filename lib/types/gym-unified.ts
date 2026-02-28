import type {
	CheckIn,
	Equipment,
	Expense,
	FinancialSummary,
	GymProfile,
	GymStats,
	MembershipPlan,
	Payment,
	StudentData,
} from "./core";

export interface GymSubscriptionSnapshot {
	id: string;
	plan: string;
	status: string;
	basePrice: number;
	pricePerStudent: number;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
	canceledAt: Date | null;
	trialStart: Date | null;
	trialEnd: Date | null;
	isTrial: boolean;
	daysRemaining: number | null;
	activeStudents: number;
	totalAmount: number;
	billingPeriod?: "monthly" | "annual";
}

export interface GymPendingAction {
	id: string;
	type: string;
	queueId?: string;
	createdAt: Date;
	retries: number;
}

export interface GymMetadata {
	lastSync: Date | null;
	isLoading: boolean;
	isInitialized: boolean;
	errors: Record<string, string | null>;
	pendingActions: GymPendingAction[];
	telemetry: Record<string, number>;
}

export interface GymUnifiedData {
	profile: GymProfile | null;
	stats: GymStats | null;
	students: StudentData[];
	equipment: Equipment[];
	financialSummary: FinancialSummary | null;
	recentCheckIns: CheckIn[];
	membershipPlans: MembershipPlan[];
	payments: Payment[];
	expenses: Expense[];
	subscription: GymSubscriptionSnapshot | null;
	metadata: GymMetadata;
}

export type GymDataSection =
	| "profile"
	| "stats"
	| "students"
	| "equipment"
	| "financialSummary"
	| "recentCheckIns"
	| "membershipPlans"
	| "payments"
	| "expenses"
	| "subscription";

export const initialGymData: GymUnifiedData = {
	profile: null,
	stats: null,
	students: [],
	equipment: [],
	financialSummary: null,
	recentCheckIns: [],
	membershipPlans: [],
	payments: [],
	expenses: [],
	subscription: null,
	metadata: {
		lastSync: null,
		isLoading: false,
		isInitialized: false,
		errors: {},
		pendingActions: [],
		telemetry: {},
	},
};
