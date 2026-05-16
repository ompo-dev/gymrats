import { Elysia } from "elysia";
import {
	createExerciseHandler,
	createUnitHandler,
	createWorkoutHandler,
	deleteExerciseHandler,
	deleteUnitHandler,
	deleteWorkoutHandler,
	updateExerciseHandler,
	updateUnitHandler,
	updateWorkoutHandler,
} from "../handlers/workout-management";
import {
	completeWorkoutHandler,
	deleteWorkoutProgressHandler,
	getUnitsHandler,
	getWorkoutHistoryHandler,
	getWorkoutProgressHandler,
	saveWorkoutProgressHandler,
	updateExerciseLogHandler,
	updateWorkoutProgressExerciseHandler,
} from "../handlers/workouts";
import {
	chatStreamWorkoutsHandler,
	chatWorkoutsHandler,
	generateWorkoutsHandler,
	populateEducationalDataHandler,
	processWorkoutsCommandHandler,
	updateAlternativesHandler,
} from "../handlers/workouts-ai";
import { authRolesMacro } from "../plugins/auth-roles";

export const workoutsRoutes = new Elysia()
	.use(authRolesMacro)
	.get("/units", ({ set, studentId }) => getUnitsHandler({ set, studentId }), {
		requireStudent: true,
	})
	.post(
		"/units",
		({ set, body, studentId }) => createUnitHandler({ set, body, studentId }),
		{ requireStudent: true },
	)
	.put(
		"/units/:id",
		({ set, body, studentId, params }) =>
			updateUnitHandler({ set, body, studentId, params }),
		{ requireStudent: true },
	)
	.delete(
		"/units/:id",
		({ set, studentId, params }) =>
			deleteUnitHandler({ set, studentId, params }),
		{ requireStudent: true },
	)
	.post(
		"/manage",
		({ set, body, studentId }) =>
			createWorkoutHandler({ set, body, studentId }),
		{ requireStudent: true },
	)
	.put(
		"/manage/:id",
		({ set, body, studentId, params }) =>
			updateWorkoutHandler({ set, body, studentId, params }),
		{ requireStudent: true },
	)
	.delete(
		"/manage/:id",
		({ set, studentId, params }) =>
			deleteWorkoutHandler({ set, studentId, params }),
		{ requireStudent: true },
	)
	.post(
		"/exercises",
		({ set, body, studentId }) =>
			createExerciseHandler({ set, body, studentId }),
		{ requireStudent: true },
	)
	.put(
		"/exercises/:id",
		({ set, body, studentId, params }) =>
			updateExerciseHandler({ set, body, studentId, params }),
		{ requireStudent: true },
	)
	.delete(
		"/exercises/:id",
		({ set, studentId, params }) =>
			deleteExerciseHandler({ set, studentId, params }),
		{ requireStudent: true },
	)
	.post(
		"/generate",
		({ set, studentId, request }) =>
			generateWorkoutsHandler({ set, studentId, request }),
		{ requireStudent: true },
	)
	.patch(
		"/generate",
		({ set, studentId, request }) =>
			updateAlternativesHandler({ set, studentId, request }),
		{ requireStudent: true },
	)
	.post(
		"/process",
		({ set, body, studentId, request }) =>
			processWorkoutsCommandHandler({ set, body, studentId, request }),
		{ requireStudent: true },
	)
	.post(
		"/chat",
		({ set, body, studentId, request }) =>
			chatWorkoutsHandler({ set, body, studentId, request }),
		{ requireStudent: true },
	)
	.post(
		"/chat-stream",
		({ set, body, studentId, user, request }) =>
			chatStreamWorkoutsHandler({ set, body, studentId, user, request }),
		{ requireStudent: true },
	)
	.post(
		"/populate-educational-data",
		({ set, studentId, request }) =>
			populateEducationalDataHandler({ set, studentId, request }),
		{ requireStudent: true },
	)
	.get(
		"/history",
		({ set, studentId }) => getWorkoutHistoryHandler({ set, studentId }),
		{ requireStudent: true },
	)
	.post(
		"/:id/complete",
		({ set, body, studentId, params }) =>
			completeWorkoutHandler({ set, body, studentId, params }),
		{ requireStudent: true },
	)
	.post(
		"/:id/progress",
		({ set, body, studentId, params }) =>
			saveWorkoutProgressHandler({ set, body, studentId, params }),
		{ requireStudent: true },
	)
	.get(
		"/:id/progress",
		({ set, studentId, params }) =>
			getWorkoutProgressHandler({ set, studentId, params }),
		{ requireStudent: true },
	)
	.delete(
		"/:id/progress",
		({ set, studentId, params }) =>
			deleteWorkoutProgressHandler({ set, studentId, params }),
		{ requireStudent: true },
	)
	.put(
		"/:id/progress/exercises/:exerciseId",
		({ set, body, studentId, params }) =>
			updateWorkoutProgressExerciseHandler({ set, body, studentId, params }),
		{ requireStudent: true },
	)
	.patch(
		"/:id/progress/exercises/:exerciseId",
		({ set, body, studentId, params }) =>
			updateWorkoutProgressExerciseHandler({ set, body, studentId, params }),
		{ requireStudent: true },
	)
	.put(
		"/history/:historyId/exercises/:exerciseId",
		({ set, body, params }) => updateExerciseLogHandler({ set, body, params }),
		{ requireStudent: true },
	)
	.patch(
		"/history/:historyId/exercises/:exerciseId",
		({ set, body, params }) => updateExerciseLogHandler({ set, body, params }),
		{ requireStudent: true },
	);
