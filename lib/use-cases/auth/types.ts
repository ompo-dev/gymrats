export type AuthRole =
  | "PENDING"
  | "STUDENT"
  | "GYM"
  | "ADMIN"
  | "PERSONAL";

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  createdAt?: Date;
  student?: {
    id: string;
    pixKey?: string | null;
    pixKeyType?: string | null;
    referralCode?: string | null;
    [key: string]: unknown;
  } | null;
  gyms?: { id: string; [key: string]: unknown }[] | null;
  personal?: { id: string; [key: string]: unknown } | null;
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
  details?: Record<string, string | number | boolean | object | null>;
};

export type UseCaseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: UseCaseError };
