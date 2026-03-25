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

export type NativeStorageNamespace = "preferences" | "notification" | "widget";

export type CapabilitySupportStatus =
  | "supported"
  | "not-supported"
  | "unavailable";

export type PushPermissionStatus =
  | "undetermined"
  | "denied"
  | "granted"
  | "provisional"
  | "unsupported";

export type PushRegistrationStatus =
  | "unregistered"
  | "registering"
  | "registered"
  | "error";

export type WidgetPreset = "home" | "workout" | "nutrition";

export type WidgetSnapshotStatus = "never" | "updated" | "error";

export type NativeCapabilities = {
  bridgeVersion: 1;
  debugToolsEnabled: boolean;
  push: {
    status: CapabilitySupportStatus;
    reason: string | null;
  };
  widgets: {
    status: CapabilitySupportStatus;
    reason: string | null;
  };
};

export type MobileInstallationPayload = {
  installationId: string;
  platform: string;
  expoPushToken?: string | null;
  pushPermission: PushPermissionStatus;
  capabilities: Record<string, unknown>;
  appVersion?: string | null;
  deviceName?: string | null;
  locale?: string | null;
  timezone?: string | null;
  active?: boolean;
};

export type MobileInstallationRecord = {
  id: string;
  platform: string;
  expoPushToken: string | null;
  pushPermission: PushPermissionStatus;
  capabilities?: Record<string, unknown> | null;
  appVersion?: string | null;
  deviceName?: string | null;
  locale?: string | null;
  timezone?: string | null;
  active: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredPushState = {
  enabled: boolean;
  installationId: string | null;
  expoPushToken: string | null;
  permissionStatus: PushPermissionStatus;
  registrationStatus: PushRegistrationStatus;
  lastError: string | null;
  lastSyncAt: string | null;
};

export type WidgetSnapshot = {
  generatedAt: string;
  preset: WidgetPreset;
  route: string;
  user: {
    name: string;
    role: AuthRole;
  } | null;
  summary: string;
};

export type StoredWidgetState = {
  preset: WidgetPreset;
  supportStatus: CapabilitySupportStatus;
  supportReason: string | null;
  lastSnapshotAt: string | null;
  lastSnapshotStatus: WidgetSnapshotStatus;
  lastError: string | null;
  snapshot: WidgetSnapshot | null;
};

export type NativeBridgeRequestType =
  | "capabilities.get"
  | "push.enable"
  | "push.disable"
  | "push.status"
  | "push.openSettings"
  | "widget.status"
  | "widget.configure"
  | "widget.refresh"
  | "widget.clear"
  | "storage.get"
  | "storage.set";

export type NativeBridgeEventType =
  | "capabilities.state"
  | "push.state"
  | "push.registered"
  | "notification.opened"
  | "widget.state"
  | "storage.result";

export type AuthStateBridgeMessage = {
  type: "auth-state";
  hasToken: boolean;
  href?: string;
};

export type NativeBridgeRequestMessage = {
  channel: "bridge-request";
  id: string;
  type: NativeBridgeRequestType;
  payload?: unknown;
};

export type NativeBridgeResponseMessage = {
  channel: "bridge-response";
  id: string;
  type: NativeBridgeRequestType;
  ok: boolean;
  payload?: unknown;
  error?: string;
};

export type NativeBridgeEventMessage = {
  channel: "bridge-event";
  type: NativeBridgeEventType;
  payload?: unknown;
};

export type WebBridgeMessage =
  | AuthStateBridgeMessage
  | NativeBridgeRequestMessage
  | NativeBridgeResponseMessage
  | NativeBridgeEventMessage
  | {
      type: string;
      [key: string]: unknown;
    };
