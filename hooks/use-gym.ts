"use client";

import {
	type GymUnifiedState,
	useGymUnifiedStore,
} from "@/stores/gym-unified-store";

type GymSelector =
	| "profile"
	| "stats"
	| "students"
	| "equipment"
	| "financialSummary"
	| "recentCheckIns"
	| "membershipPlans"
	| "payments"
	| "expenses"
	| "subscription"
	| "metadata"
	| "actions"
	| "loaders";

const dataSelector = (selector: GymSelector, data: any) => {
	switch (selector) {
		case "actions":
		case "loaders":
			return undefined;
		default:
			return data[selector];
	}
};

export function useGym<T extends GymSelector>(
	...selectors: T[]
): T extends []
	? GymUnifiedState["data"]
	: T extends [infer First]
		? First extends GymSelector
			? any
			: never
		: Record<string, any> {
	const data = useGymUnifiedStore((state) => state.data);
	const loadAll = useGymUnifiedStore((state) => state.loadAll);
	const loadAllPrioritized = useGymUnifiedStore((state) => state.loadAllPrioritized);
	const loadSection = useGymUnifiedStore((state) => state.loadSection);
	const hydrateInitial = useGymUnifiedStore((state) => state.hydrateInitial);
	const createExpense = useGymUnifiedStore((state) => state.createExpense);
	const createPayment = useGymUnifiedStore((state) => state.createPayment);
	const checkInStudent = useGymUnifiedStore((state) => state.checkInStudent);
	const checkOutStudent = useGymUnifiedStore((state) => state.checkOutStudent);
	const updatePaymentStatus = useGymUnifiedStore(
		(state) => state.updatePaymentStatus,
	);
	const updateMemberStatus = useGymUnifiedStore((state) => state.updateMemberStatus);
	const createEquipment = useGymUnifiedStore((state) => state.createEquipment);
	const updateEquipment = useGymUnifiedStore((state) => state.updateEquipment);
	const createMaintenance = useGymUnifiedStore((state) => state.createMaintenance);
	const createMembershipPlan = useGymUnifiedStore(
		(state) => state.createMembershipPlan,
	);
	const updateMembershipPlan = useGymUnifiedStore(
		(state) => state.updateMembershipPlan,
	);
	const deleteMembershipPlan = useGymUnifiedStore(
		(state) => state.deleteMembershipPlan,
	);
	const enrollStudent = useGymUnifiedStore((state) => state.enrollStudent);
	const createGymSubscription = useGymUnifiedStore(
		(state) => state.createGymSubscription,
	);
	const cancelGymSubscription = useGymUnifiedStore(
		(state) => state.cancelGymSubscription,
	);

	if (selectors.length === 0) {
		return data as any;
	}

	if (selectors.length === 1) {
		const selector = selectors[0];
		if (selector === "actions") {
			return {
				createExpense,
				createPayment,
				checkInStudent,
				checkOutStudent,
				updatePaymentStatus,
				updateMemberStatus,
				createEquipment,
				updateEquipment,
				createMaintenance,
				createMembershipPlan,
				updateMembershipPlan,
				deleteMembershipPlan,
				enrollStudent,
				createGymSubscription,
				cancelGymSubscription,
				hydrateInitial,
			} as any;
		}
		if (selector === "loaders") {
			return {
				loadAll,
				loadAllPrioritized,
				loadSection,
			} as any;
		}
		return dataSelector(selector, data) as any;
	}

	const result: Record<string, any> = {};
	selectors.forEach((selector) => {
		if (selector === "actions") {
			result.actions = {
				createExpense,
				createPayment,
				checkInStudent,
				checkOutStudent,
				updatePaymentStatus,
				updateMemberStatus,
				createEquipment,
				updateEquipment,
				createMaintenance,
				createMembershipPlan,
				updateMembershipPlan,
				deleteMembershipPlan,
				enrollStudent,
				createGymSubscription,
				cancelGymSubscription,
				hydrateInitial,
			};
		} else if (selector === "loaders") {
			result.loaders = {
				loadAll,
				loadAllPrioritized,
				loadSection,
			};
		} else {
			result[selector] = dataSelector(selector, data);
		}
	});

	return result as any;
}
