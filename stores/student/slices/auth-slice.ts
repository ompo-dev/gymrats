/**
 * Slice de autenticação/user para student-unified-store.
 */

import { loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

export function createAuthSlice(
	set: StudentSetState,
	_get: StudentGetState,
) {
	return {
		loadUser: async () => {
			const section = await loadSection("user");
			set((state) => ({
				data: {
					...state.data,
					user: { ...state.data.user, ...section.user },
				},
			}));
		},
	};
}
