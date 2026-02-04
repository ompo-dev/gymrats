import { Elysia } from "elysia";
import {
	activatePremiumHandler,
	cancelSubscriptionHandler,
	createSubscriptionHandler,
	getCurrentSubscriptionHandler,
	startTrialHandler,
} from "../handlers/subscriptions";
import { authRolesMacro } from "../plugins/auth-roles";

export const subscriptionsRoutes = new Elysia()
	.use(authRolesMacro)
	.get(
		"/current",
		({ set, studentId, userId }) =>
			getCurrentSubscriptionHandler({ set, studentId, userId }),
		{ requireStudent: true },
	)
	.post(
		"/create",
		({ set, body, studentId, userId }) =>
			createSubscriptionHandler({ set, body, studentId, userId }),
		{ requireStudent: true },
	)
	.post(
		"/start-trial",
		({ set, body, studentId, userId }) =>
			startTrialHandler({ set, body, studentId, userId }),
		{ requireStudent: true },
	)
	.post(
		"/cancel",
		({ set, studentId, userId }) =>
			cancelSubscriptionHandler({ set, studentId, userId }),
		{ requireStudent: true },
	)
	.post(
		"/activate-premium",
		({ set, body, studentId, userId }) =>
			activatePremiumHandler({ set, body, studentId, userId }),
		{ requireStudent: true },
	);
