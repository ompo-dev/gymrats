export type AuthRole = "PENDING" | "STUDENT" | "GYM" | "PERSONAL" | "ADMIN";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  hasGym: boolean;
  hasStudent: boolean;
  activeGymId?: string | null;
  gyms?: Array<{
    id: string;
    plan?: string;
    subscription?: {
      plan: string;
      status: string;
      currentPeriodEnd?: string | null;
    } | null;
  }>;
  student?: {
    id: string;
    subscription?: {
      plan: string;
      status: string;
      currentPeriodEnd?: string | null;
    } | null;
  } | null;
  personal?: {
    id: string;
  } | null;
};

export type AuthSessionPayload = {
  user: SessionUser;
  session: {
    id: string;
    token: string;
  };
};

export type PersistedSession = {
  token: string | null;
  user: SessionUser | null;
};

export type AppConfig = {
  webUrl: string;
  apiUrl: string;
};

export type AppStore = {
  hydrated: boolean;
  config: AppConfig;
  session: PersistedSession;
  hydrate: () => Promise<void>;
  updateConfig: (nextConfig: AppConfig) => Promise<void>;
  upsertSession: (payload: AuthSessionPayload) => Promise<void>;
  clearSession: () => Promise<void>;
};

export type WebBridgeMessage =
  | {
      type: "auth-state";
      hasToken: boolean;
      href?: string;
    }
  | {
      type: string;
      [key: string]: unknown;
    };
