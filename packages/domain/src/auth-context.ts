import { db } from "@gymrats/db";

type AuthRecord = Record<string, string | number | boolean | object | null>;
type AuthStudentRecord = AuthRecord & { id: string };

export type AuthSession = {
  session: AuthRecord;
  user: {
    id: string;
    student?: AuthStudentRecord | null;
    personal?: { id: string } | null;
    gyms?: { id: string }[];
    role?: string;
    activeGymId?: string;
    name?: string;
    email?: string;
    [key: string]: string | number | boolean | object | null | undefined;
  };
};

export type GymContext = {
  gymId: string;
  session: AuthSession["session"];
  user: AuthSession["user"];
};

export type StudentContext = {
  studentId: string;
  session: AuthSession["session"];
  user: AuthSession["user"];
  student: AuthStudentRecord;
};

export type PersonalContext = {
  personalId: string;
  session: AuthSession["session"];
  user: AuthSession["user"];
};

export type UserOnlyContext = {
  user: AuthSession["user"];
  session: AuthSession["session"];
};

export type ContextLookupPolicy = "never" | "always" | "admin-only";

export interface AuthContextPolicy {
  gymLookupWhenMissing: ContextLookupPolicy;
  studentLookupWhenMissing: ContextLookupPolicy;
  personalLookupWhenMissing: ContextLookupPolicy;
  personalMissingStatus: number;
  personalMissingMessage: string;
}

export interface AuthContextDeps {
  findGymIdByUserId: (userId: string) => Promise<string | null>;
  findPersonalIdByUserId: (userId: string) => Promise<string | null>;
  findStudentByUserId: (userId: string) => Promise<AuthStudentRecord | null>;
}

export type AuthContextFailure = {
  message: string;
  status?: number;
};

export type AuthContextResolution<TContext> =
  | { ok: true; ctx: TContext }
  | { ok: false; error: AuthContextFailure };

const authContextDeps: AuthContextDeps = {
  async findGymIdByUserId(userId) {
    const gym = await db.gym.findFirst({
      where: { userId },
      select: { id: true },
    });
    return gym?.id ?? null;
  },
  async findPersonalIdByUserId(userId) {
    const personal = await db.personal.findUnique({
      where: { userId },
      select: { id: true },
    });
    return personal?.id ?? null;
  },
  async findStudentByUserId(userId) {
    const student = await db.student.findUnique({
      where: { userId },
    });
    return (student as AuthStudentRecord | null) ?? null;
  },
};

function ok<TContext>(ctx: TContext): AuthContextResolution<TContext> {
  return { ok: true, ctx };
}

function fail(message: string, status?: number): AuthContextResolution<never> {
  return { ok: false, error: { message, status } };
}

function shouldUseLookup(
  policy: ContextLookupPolicy,
  role: string | undefined,
): boolean {
  if (policy === "always") {
    return true;
  }

  if (policy === "admin-only") {
    return role === "ADMIN";
  }

  return false;
}

export async function resolveGymContext(
  auth: AuthSession,
  policy: AuthContextPolicy,
  deps: AuthContextDeps = authContextDeps,
): Promise<AuthContextResolution<GymContext>> {
  let gymId: string | null | undefined =
    auth.user.activeGymId || auth.user.gyms?.[0]?.id;

  if (!gymId && shouldUseLookup(policy.gymLookupWhenMissing, auth.user.role)) {
    gymId = await deps.findGymIdByUserId(auth.user.id);
  }

  if (!gymId) {
    return fail("Academia nao encontrada", 403);
  }

  return ok({
    gymId,
    session: auth.session,
    user: auth.user,
  });
}

export async function resolveStudentContext(
  auth: AuthSession,
  policy: AuthContextPolicy,
  deps: AuthContextDeps = authContextDeps,
): Promise<AuthContextResolution<StudentContext>> {
  let student = auth.user.student;

  if (
    !student &&
    shouldUseLookup(policy.studentLookupWhenMissing, auth.user.role)
  ) {
    student = await deps.findStudentByUserId(auth.user.id);
  }

  if (!student) {
    return fail("Perfil de aluno nao encontrado.");
  }

  return ok({
    studentId: String(student.id),
    session: auth.session,
    user: auth.user,
    student,
  });
}

export async function resolvePersonalContext(
  auth: AuthSession,
  policy: AuthContextPolicy,
  deps: AuthContextDeps = authContextDeps,
): Promise<AuthContextResolution<PersonalContext>> {
  const isAdmin = auth.user.role === "ADMIN";
  const isPersonalRole = auth.user.role === "PERSONAL";

  if (!isAdmin && !isPersonalRole) {
    return fail("Usuario nao e um personal", 403);
  }

  let personalId: string | null | undefined = auth.user.personal?.id;

  if (
    !personalId &&
    shouldUseLookup(policy.personalLookupWhenMissing, auth.user.role)
  ) {
    personalId = await deps.findPersonalIdByUserId(auth.user.id);
  }

  if (!personalId) {
    return fail(policy.personalMissingMessage, policy.personalMissingStatus);
  }

  return ok({
    personalId,
    session: auth.session,
    user: auth.user,
  });
}
