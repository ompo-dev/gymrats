/**
 * Mapeamento de tipos de retorno por seletor do useGym.
 * Usado para inferência de tipo correta sem cast explícito.
 */

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
} from "@/lib/types";
import type {
	GymMetadata,
	GymSubscriptionSnapshot,
} from "@/lib/types/gym-unified";

/** Tipo das actions retornadas por useGym("actions") */
export type GymActions = Pick<
	import("@/stores/gym-unified-store").GymUnifiedState,
	| "createExpense"
	| "createPayment"
	| "checkInStudent"
	| "checkOutStudent"
	| "updatePaymentStatus"
	| "updateMemberStatus"
	| "createEquipment"
	| "updateEquipment"
	| "createMaintenance"
	| "createMembershipPlan"
	| "updateMembershipPlan"
	| "deleteMembershipPlan"
	| "enrollStudent"
	| "createGymSubscription"
	| "cancelGymSubscription"
	| "hydrateInitial"
>;

/** Tipo dos loaders retornados por useGym("loaders") */
export type GymLoaders = Pick<
	import("@/stores/gym-unified-store").GymUnifiedState,
	"loadAll" | "loadAllPrioritized" | "loadSection"
>;

/** Mapa seletor -> tipo de retorno */
export interface GymSelectorReturnMap {
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
	actions: GymActions;
	loaders: GymLoaders;
}

export type GymDataSelector = keyof GymSelectorReturnMap;

/** Extrai o tipo de retorno para um seletor de dados (não actions/loaders) */
export type GymSelectorDataReturn<S extends GymDataSelector> =
	GymSelectorReturnMap[S];
