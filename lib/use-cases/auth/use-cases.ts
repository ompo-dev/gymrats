import type {
	AuthRole,
	BetterAuthSession,
	SessionWithUser,
	UseCaseResult,
	UserSummary,
} from "./types";

type OkResult<T> = { ok: true; data: T };
type ErrorResult = {
	ok: false;
	error: { message: string; status: number; details?: unknown };
};

const ok = <T>(data: T): OkResult<T> => ({ ok: true, data });
const fail = (
	message: string,
	status: number,
	details?: unknown,
): ErrorResult => ({
	ok: false,
	error: { message, status, details },
});

export interface SignInInput {
	email: string;
	password: string;
}

export interface SignInDeps {
	findUserByEmail: (email: string) => Promise<UserSummary | null>;
	comparePassword: (plain: string, hashed: string) => Promise<boolean>;
	createSession: (userId: string) => Promise<string>;
}

export interface SignInOutput {
	user: { id: string; email: string; name: string; role: string };
	session: { token: string };
	sessionToken: string;
}

export async function signInUseCase(
	deps: SignInDeps,
	input: SignInInput,
): Promise<UseCaseResult<SignInOutput>> {
	const user = await deps.findUserByEmail(input.email);
	if (!user || !user.password) {
		return fail("Email ou senha incorretos", 401);
	}

	const isValidPassword = await deps.comparePassword(
		input.password,
		user.password,
	);
	if (!isValidPassword) {
		return fail("Email ou senha incorretos", 401);
	}

	const sessionToken = await deps.createSession(user.id);

	return ok({
		user: { id: user.id, email: user.email, name: user.name, role: user.role },
		session: { token: sessionToken },
		sessionToken,
	});
}

export interface SignUpInput {
	name: string;
	email: string;
	password: string;
}

export interface SignUpDeps {
	findUserByEmail: (email: string) => Promise<UserSummary | null>;
	hashPassword: (plain: string) => Promise<string>;
	createUser: (data: {
		name: string;
		email: string;
		password: string;
		role: AuthRole;
	}) => Promise<UserSummary>;
	createStudent: (userId: string) => Promise<void>;
	createSession: (userId: string) => Promise<string>;
}

export interface SignUpOutput {
	user: { id: string; email: string; name: string; role: string };
	session: { token: string };
	sessionToken: string;
}

export async function signUpUseCase(
	deps: SignUpDeps,
	input: SignUpInput,
): Promise<UseCaseResult<SignUpOutput>> {
	const existingUser = await deps.findUserByEmail(input.email);
	if (existingUser) {
		return fail("Este email já está cadastrado", 400);
	}

	const hashedPassword = await deps.hashPassword(input.password);
	const newUser = await deps.createUser({
		email: input.email,
		password: hashedPassword,
		name: input.name,
		role: "STUDENT",
	});

	await deps.createStudent(newUser.id);

	const sessionToken = await deps.createSession(newUser.id);

	return ok({
		user: {
			id: newUser.id,
			email: newUser.email,
			name: newUser.name,
			role: newUser.role,
		},
		session: { token: sessionToken },
		sessionToken,
	});
}

export interface UpdateRoleInput {
	userId: string;
	role: "STUDENT" | "GYM" | "ADMIN";
	userType?: "student" | "gym";
}

export interface UpdateRoleDeps {
	findUserById: (userId: string) => Promise<UserSummary | null>;
	updateUserRole: (
		userId: string,
		role: "STUDENT" | "GYM" | "ADMIN",
	) => Promise<UserSummary>;
	findStudentByUserId: (userId: string) => Promise<{ id: string } | null>;
	createStudent: (userId: string) => Promise<void>;
	findGymByUserId: (userId: string) => Promise<{ id: string } | null>;
	createGym: (data: {
		userId: string;
		name: string;
		address: string;
		phone: string;
		email: string;
		plan: string;
		isActive: boolean;
	}) => Promise<void>;
}

export interface UpdateRoleOutput {
	success: true;
	user: { id: string; role: string };
}

export async function updateRoleUseCase(
	deps: UpdateRoleDeps,
	input: UpdateRoleInput,
): Promise<UseCaseResult<UpdateRoleOutput>> {
	const user = await deps.findUserById(input.userId);
	if (!user) {
		return fail("Usuário não encontrado", 404);
	}

	const updatedUser = await deps.updateUserRole(input.userId, input.role);

	if (input.role === "STUDENT" && !user.student) {
		const existingStudent = await deps.findStudentByUserId(input.userId);
		if (!existingStudent) {
			await deps.createStudent(input.userId);
		}
	}

	if (input.role === "GYM" && (!user.gyms || user.gyms.length === 0)) {
		const existingGym = await deps.findGymByUserId(input.userId);
		if (!existingGym) {
			await deps.createGym({
				userId: input.userId,
				name: user.name,
				address: "",
				phone: "",
				email: user.email,
				plan: "basic",
				isActive: true,
			});
		}
	}

	return ok({
		success: true,
		user: {
			id: updatedUser.id,
			role: updatedUser.role,
		},
	});
}

export interface ForgotPasswordInput {
	email: string;
}

export interface ForgotPasswordDeps {
	findUserByEmail: (email: string) => Promise<UserSummary | null>;
	deleteTokensByIdentifier: (identifier: string) => Promise<void>;
	createVerificationToken: (data: {
		identifier: string;
		token: string;
		expires: Date;
	}) => Promise<void>;
	sendResetPasswordEmail: (data: {
		to: string;
		name: string;
		code: string;
	}) => Promise<void>;
	generateResetCode: () => string;
	now: () => Date;
}

export interface ForgotPasswordOutput {
	message: string;
}

export async function forgotPasswordUseCase(
	deps: ForgotPasswordDeps,
	input: ForgotPasswordInput,
): Promise<UseCaseResult<ForgotPasswordOutput>> {
	const user = await deps.findUserByEmail(input.email);

	if (user) {
		const code = deps.generateResetCode();
		const expires = deps.now();
		expires.setMinutes(expires.getMinutes() + 15);

		await deps.deleteTokensByIdentifier(`reset-password:${input.email}`);
		await deps.createVerificationToken({
			identifier: `reset-password:${input.email}`,
			token: code,
			expires,
		});

		try {
			await deps.sendResetPasswordEmail({
				to: user.email,
				name: user.name,
				code,
			});
		} catch (emailError) {
			console.error("Erro ao enviar email de recuperação:", emailError);
		}
	}

	return ok({
		message:
			"Se o email estiver cadastrado, você receberá um código de verificação.",
	});
}

export interface VerifyResetCodeInput {
	email: string;
	code: string;
}

export interface VerifyResetCodeDeps {
	findVerificationToken: (
		identifier: string,
		token: string,
	) => Promise<{ expires: Date } | null>;
	deleteVerificationToken: (identifier: string, token: string) => Promise<void>;
	findUserByEmail: (email: string) => Promise<UserSummary | null>;
	now: () => Date;
}

export interface VerifyResetCodeOutput {
	valid: true;
	message: string;
}

export async function verifyResetCodeUseCase(
	deps: VerifyResetCodeDeps,
	input: VerifyResetCodeInput,
): Promise<UseCaseResult<VerifyResetCodeOutput>> {
	const verificationToken = await deps.findVerificationToken(
		`reset-password:${input.email}`,
		input.code,
	);

	if (!verificationToken) {
		return fail("Código inválido", 400);
	}

	if (deps.now() > verificationToken.expires) {
		await deps.deleteVerificationToken(
			`reset-password:${input.email}`,
			input.code,
		);
		return fail("Código expirado. Solicite um novo código.", 400);
	}

	const user = await deps.findUserByEmail(input.email);
	if (!user) {
		return fail("Usuário não encontrado", 404);
	}

	return ok({
		valid: true,
		message: "Código verificado com sucesso",
	});
}

export interface ResetPasswordInput {
	email: string;
	code: string;
	newPassword: string;
}

export interface ResetPasswordDeps {
	findVerificationToken: (
		identifier: string,
		token: string,
	) => Promise<{ expires: Date } | null>;
	deleteVerificationToken: (identifier: string, token: string) => Promise<void>;
	findUserByEmail: (email: string) => Promise<UserSummary | null>;
	hashPassword: (plain: string) => Promise<string>;
	updateUserPassword: (userId: string, password: string) => Promise<void>;
	now: () => Date;
}

export interface ResetPasswordOutput {
	message: string;
}

export async function resetPasswordUseCase(
	deps: ResetPasswordDeps,
	input: ResetPasswordInput,
): Promise<UseCaseResult<ResetPasswordOutput>> {
	const verificationToken = await deps.findVerificationToken(
		`reset-password:${input.email}`,
		input.code,
	);

	if (!verificationToken) {
		return fail("Código inválido", 400);
	}

	if (deps.now() > verificationToken.expires) {
		await deps.deleteVerificationToken(
			`reset-password:${input.email}`,
			input.code,
		);
		return fail("Código expirado. Solicite um novo código.", 400);
	}

	const user = await deps.findUserByEmail(input.email);
	if (!user) {
		return fail("Usuário não encontrado", 404);
	}

	const hashedPassword = await deps.hashPassword(input.newPassword);
	await deps.updateUserPassword(user.id, hashedPassword);
	await deps.deleteVerificationToken(
		`reset-password:${input.email}`,
		input.code,
	);

	return ok({ message: "Senha redefinida com sucesso" });
}

export interface GetSessionInput {
	headers: Headers;
	authHeaderToken?: string | null;
	cookieAuthToken?: string | null;
	cookieBetterAuthToken?: string | null;
}

export interface GetSessionDeps {
	getBetterAuthSession: (headers: Headers) => Promise<BetterAuthSession | null>;
	findUserById: (userId: string) => Promise<UserSummary | null>;
	getSessionTokenById: (sessionId: string) => Promise<string | null>;
	getSessionByToken: (token: string) => Promise<SessionWithUser | null>;
}

export interface GetSessionOutput {
	user: {
		id: string;
		email: string;
		name: string;
		role: string;
		hasGym: boolean;
		hasStudent: boolean;
		createdAt?: Date;
	};
	session: {
		id: string;
		token: string;
	};
	sessionToken: string;
	shouldSyncAuthToken: boolean;
}

export async function getSessionUseCase(
	deps: GetSessionDeps,
	input: GetSessionInput,
): Promise<UseCaseResult<GetSessionOutput>> {
	try {
		const betterAuthSession = await deps.getBetterAuthSession(input.headers);
		if (betterAuthSession?.user?.id) {
			const user = await deps.findUserById(betterAuthSession.user.id);
			if (user) {
				const isAdmin = user.role === "ADMIN";
				const hasGym = isAdmin || (user.gyms?.length ?? 0) > 0;
				const hasStudent = isAdmin || !!user.student;

				const headerToken = input.authHeaderToken || null;
				const cookieToken = input.cookieBetterAuthToken || null;
				let sessionToken = cookieToken || headerToken;

				const sessionId = betterAuthSession.session?.id || "";
				if (!sessionToken && sessionId) {
					sessionToken = (await deps.getSessionTokenById(sessionId)) || "";
				}
				if (!sessionToken) {
					sessionToken = sessionId || "";
				}

				return ok({
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
						role: user.role,
						hasGym,
						hasStudent,
						createdAt: user.createdAt,
					},
					session: {
						id: sessionId,
						token: sessionToken,
					},
					sessionToken,
					shouldSyncAuthToken: Boolean(sessionToken),
				});
			}
		}
	} catch (_betterAuthError) {
		console.log(
			"[session] Better Auth não encontrou sessão, tentando método antigo",
		);
	}

	const legacyToken =
		input.authHeaderToken ||
		input.cookieAuthToken ||
		input.cookieBetterAuthToken ||
		null;

	if (!legacyToken) {
		return fail("Token não fornecido", 401);
	}

	const sessionToken = legacyToken.trim();
	const session = await deps.getSessionByToken(sessionToken);
	if (!session) {
		return fail("Sessão inválida ou expirada", 401);
	}

	const isAdmin = session.user.role === "ADMIN";
	const hasGym = isAdmin || (session.user.gyms?.length ?? 0) > 0;
	const hasStudent = isAdmin || !!session.user.student;

	return ok({
		user: {
			id: session.user.id,
			email: session.user.email,
			name: session.user.name,
			role: session.user.role,
			hasGym,
			hasStudent,
			createdAt: session.user.createdAt,
		},
		session: {
			id: session.id,
			token: session.token || session.sessionToken || sessionToken,
		},
		sessionToken: session.token || session.sessionToken || sessionToken,
		shouldSyncAuthToken: false,
	});
}

export interface SignOutInput {
	headers: Headers;
	authHeaderToken?: string | null;
	cookieAuthToken?: string | null;
	cookieBetterAuthToken?: string | null;
}

export interface SignOutDeps {
	signOutBetterAuth: (headers: Headers) => Promise<void>;
	deleteSession: (token: string) => Promise<void>;
}

export interface SignOutOutput {
	success: true;
	shouldClearCookies: boolean;
}

export async function signOutUseCase(
	deps: SignOutDeps,
	input: SignOutInput,
): Promise<UseCaseResult<SignOutOutput>> {
	try {
		await deps.signOutBetterAuth(input.headers);
		return ok({ success: true, shouldClearCookies: true });
	} catch (_betterAuthError) {
		console.log("[sign-out] Better Auth logout falhou, tentando método antigo");
	}

	const sessionToken =
		input.authHeaderToken ||
		input.cookieAuthToken ||
		input.cookieBetterAuthToken;

	if (!sessionToken) {
		return fail("Token não fornecido", 401);
	}

	await deps.deleteSession(sessionToken.trim());
	return ok({ success: true, shouldClearCookies: true });
}
