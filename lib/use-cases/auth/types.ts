export type AuthRole = "STUDENT" | "GYM" | "ADMIN";

export interface UserSummary {
	id: string;
	email: string;
	name: string;
	role: AuthRole;
	createdAt?: Date;
	student?: { id: string } | null;
	gyms?: { id: string }[] | null;
	password?: string | null;
}

export interface SessionWithUser {
	id: string;
	token?: string | null;
	sessionToken?: string | null;
	user: UserSummary;
}

export interface BetterAuthSession {
	user?: { id: string } | null;
	session?: { id?: string | null } | null;
}

export type UseCaseError = {
	message: string;
	status: number;
	details?: unknown;
};

export type UseCaseResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: UseCaseError };
