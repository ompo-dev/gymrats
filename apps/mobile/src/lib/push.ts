import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";
import type {
  MobileInstallationPayload,
  NativeCapabilities,
  PushPermissionStatus,
  StoredPushState,
} from "../store/types";
import {
  deactivateMobileInstallation,
  registerMobileInstallation,
  sendTestMobileNotification,
} from "./native-api";
import {
  getAppOwnership,
  getAppVersionLabel,
  isDebugToolsEnabled,
} from "./runtime";
import {
  clearStoredInstallationId,
  readNativeNamespace,
  readStoredInstallationId,
  writeNativeNamespace,
  writeStoredInstallationId,
} from "./storage";

const PUSH_CHANNEL_ID = "gymrats-default";

let notificationHandlerInstalled = false;

export function getDefaultPushState(): StoredPushState {
  return {
    enabled: false,
    installationId: null,
    expoPushToken: null,
    permissionStatus: "undetermined",
    registrationStatus: "unregistered",
    lastError: null,
    lastSyncAt: null,
  };
}

export async function readStoredPushState() {
  return (
    (await readNativeNamespace<StoredPushState>("notification")) ??
    getDefaultPushState()
  );
}

async function writeStoredPushState(state: StoredPushState) {
  await writeNativeNamespace("notification", state);
}

function createInstallationId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `gymrats-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
}

async function ensureInstallationId() {
  const existing = await readStoredInstallationId();
  if (existing) {
    return existing;
  }

  const installationId = createInstallationId();
  await writeStoredInstallationId(installationId);
  return installationId;
}

function normalizePermissionStatus(
  permissions: Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>,
): PushPermissionStatus {
  if (permissions.granted) {
    return "granted";
  }

  if (
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return "provisional";
  }

  if (permissions.status === "denied") {
    return "denied";
  }

  if (permissions.status === "undetermined") {
    return "undetermined";
  }

  return "unsupported";
}

function getProjectId() {
  const projectId =
    Constants.easConfig?.projectId ||
    (
      Constants.expoConfig?.extra as
        | { eas?: { projectId?: string } }
        | undefined
    )?.eas?.projectId;

  if (!projectId) {
    throw new Error("O projectId do Expo nao foi encontrado para push.");
  }

  return projectId;
}

function getDeviceMetadata() {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || null;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;

  return {
    appVersion: getAppVersionLabel(),
    deviceName:
      Device.deviceName ||
      Constants.expoConfig?.name ||
      Application.applicationName ||
      null,
    locale,
    timezone,
  };
}

function toInstallationPayload(
  installationId: string,
  expoPushToken: string | null,
  permissionStatus: PushPermissionStatus,
  capabilities: NativeCapabilities,
): MobileInstallationPayload {
  const metadata = getDeviceMetadata();

  return {
    installationId,
    platform: Platform.OS,
    expoPushToken,
    pushPermission: permissionStatus,
    capabilities: {
      bridgeVersion: capabilities.bridgeVersion,
      debugToolsEnabled: capabilities.debugToolsEnabled,
      push: capabilities.push.status,
      widgets: capabilities.widgets.status,
    },
    appVersion: metadata.appVersion,
    deviceName: metadata.deviceName,
    locale: metadata.locale,
    timezone: metadata.timezone,
    active: true,
  };
}

export function getPushCapability() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return {
      status: "not-supported" as const,
      reason: "Push remoto so esta disponivel em iOS e Android.",
    };
  }

  if (getAppOwnership() === "expo") {
    return {
      status: "unavailable" as const,
      reason: "Push remoto exige development build ou build de loja.",
    };
  }

  if (!Device.isDevice) {
    return {
      status: "unavailable" as const,
      reason: "Push remoto exige um dispositivo fisico.",
    };
  }

  return {
    status: "supported" as const,
    reason: null,
  };
}

export async function getPushStateSnapshot() {
  const storedState = await readStoredPushState();
  const capability = getPushCapability();

  if (capability.status !== "supported") {
    const nextState: StoredPushState = {
      ...storedState,
      permissionStatus: "unsupported",
      registrationStatus: storedState.enabled ? "error" : "unregistered",
      lastError: capability.reason,
    };
    await writeStoredPushState(nextState);
    return nextState;
  }

  const permissions = await Notifications.getPermissionsAsync();
  const permissionStatus = normalizePermissionStatus(permissions);
  const nextState: StoredPushState = {
    ...storedState,
    permissionStatus,
    lastError:
      permissionStatus === "denied"
        ? "As notificacoes estao negadas neste dispositivo."
        : storedState.lastError,
  };

  await writeStoredPushState(nextState);
  return nextState;
}

export async function configurePushChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
    name: "GymRats",
    description: "Alertas importantes da sua conta e da plataforma.",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#58CC02",
    sound: "default",
  });
}

export function installNotificationHandler() {
  if (notificationHandlerInstalled) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  notificationHandlerInstalled = true;
}

export async function enablePushNotifications(options: {
  apiUrl: string;
  sessionToken: string;
  capabilities: NativeCapabilities;
}) {
  const capability = getPushCapability();
  if (capability.status !== "supported") {
    const failedState: StoredPushState = {
      ...(await readStoredPushState()),
      enabled: false,
      permissionStatus: "unsupported",
      registrationStatus: "error",
      lastError: capability.reason,
    };
    await writeStoredPushState(failedState);
    throw new Error(capability.reason || "Push remoto indisponivel.");
  }

  const currentState = await readStoredPushState();
  const registeringState: StoredPushState = {
    ...currentState,
    enabled: true,
    registrationStatus: "registering",
    lastError: null,
  };
  await writeStoredPushState(registeringState);

  await configurePushChannel();

  const existingPermissions = await Notifications.getPermissionsAsync();
  let permissionStatus = normalizePermissionStatus(existingPermissions);

  if (permissionStatus !== "granted" && permissionStatus !== "provisional") {
    const requestedPermissions = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowProvisional: true,
      },
    });
    permissionStatus = normalizePermissionStatus(requestedPermissions);
  }

  if (permissionStatus !== "granted" && permissionStatus !== "provisional") {
    const deniedState: StoredPushState = {
      ...registeringState,
      enabled: false,
      permissionStatus,
      registrationStatus: "error",
      lastError: "Permissao de notificacao nao concedida.",
    };
    await writeStoredPushState(deniedState);
    throw new Error("Permissao de notificacao nao concedida.");
  }

  const installationId = await ensureInstallationId();
  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({
      projectId: getProjectId(),
    })
  ).data;

  await registerMobileInstallation(
    options.apiUrl,
    options.sessionToken,
    toInstallationPayload(
      installationId,
      expoPushToken,
      permissionStatus,
      options.capabilities,
    ),
  );

  const nextState: StoredPushState = {
    enabled: true,
    installationId,
    expoPushToken,
    permissionStatus,
    registrationStatus: "registered",
    lastError: null,
    lastSyncAt: new Date().toISOString(),
  };

  await writeStoredPushState(nextState);
  return nextState;
}

export async function reconcilePushNotifications(options: {
  apiUrl: string;
  sessionToken: string | null;
  capabilities: NativeCapabilities;
}) {
  const currentState = await getPushStateSnapshot();
  if (!options.sessionToken || !currentState.enabled) {
    return currentState;
  }

  if (
    currentState.permissionStatus !== "granted" &&
    currentState.permissionStatus !== "provisional"
  ) {
    return currentState;
  }

  try {
    return await enablePushNotifications({
      apiUrl: options.apiUrl,
      sessionToken: options.sessionToken,
      capabilities: options.capabilities,
    });
  } catch (error) {
    const failedState: StoredPushState = {
      ...currentState,
      registrationStatus: "error",
      lastError:
        error instanceof Error ? error.message : "Falha ao sincronizar push.",
    };
    await writeStoredPushState(failedState);
    return failedState;
  }
}

export async function unlinkPushInstallationForLogout(options: {
  apiUrl: string;
  sessionToken: string | null;
}) {
  const currentState = await readStoredPushState();

  if (currentState.installationId && options.sessionToken) {
    try {
      await deactivateMobileInstallation(
        options.apiUrl,
        options.sessionToken,
        currentState.installationId,
      );
    } catch {
      // noop
    }
  }

  const nextState: StoredPushState = {
    ...currentState,
    expoPushToken: null,
    registrationStatus: currentState.enabled ? "unregistered" : "unregistered",
    lastError: null,
    lastSyncAt: null,
  };

  await writeStoredPushState(nextState);
  return nextState;
}

export async function disablePushNotifications(options: {
  apiUrl: string;
  sessionToken: string | null;
}) {
  const currentState = await readStoredPushState();

  if (currentState.installationId && options.sessionToken) {
    try {
      await deactivateMobileInstallation(
        options.apiUrl,
        options.sessionToken,
        currentState.installationId,
      );
    } catch {
      // Continua com a limpeza local para nao prender a UX.
    }
  }

  const nextState: StoredPushState = {
    ...currentState,
    enabled: false,
    permissionStatus: currentState.permissionStatus,
    expoPushToken: null,
    registrationStatus: "unregistered",
    lastError: null,
    lastSyncAt: null,
  };

  await writeStoredPushState(nextState);
  return nextState;
}

export async function attemptDeactivateInstallation(options: {
  apiUrl: string;
  sessionToken: string | null;
}) {
  const currentState = await readStoredPushState();
  if (!currentState.installationId || !options.sessionToken) {
    return;
  }

  try {
    await deactivateMobileInstallation(
      options.apiUrl,
      options.sessionToken,
      currentState.installationId,
    );
  } catch {
    // noop
  }
}

export async function resetPushDeviceState() {
  await writeStoredPushState(getDefaultPushState());
  await clearStoredInstallationId();
}

export function getShortPushToken(token: string | null) {
  if (!token) {
    return "nao registrado";
  }

  return token.length <= 18
    ? token
    : `${token.slice(0, 8)}...${token.slice(-8)}`;
}

export async function openPushSystemSettings() {
  await Linking.openSettings();
}

export async function sendPushTest(options: {
  apiUrl: string;
  sessionToken: string;
  route: string;
}) {
  const currentState = await readStoredPushState();
  if (!currentState.installationId) {
    throw new Error("Nenhuma instalacao de push foi registrada ainda.");
  }

  return sendTestMobileNotification(
    options.apiUrl,
    options.sessionToken,
    currentState.installationId,
    {
      route: options.route,
    },
  );
}

export function getDebugPushMetadata() {
  return {
    platform: Platform.OS,
    appVersion: getAppVersionLabel(),
    ownership: getAppOwnership(),
    debugToolsEnabled: isDebugToolsEnabled(),
  };
}

export function extractRouteFromNotificationData(
  data: Record<string, unknown> | null | undefined,
) {
  const route =
    typeof data?.route === "string"
      ? data.route
      : typeof data?.path === "string"
        ? data.path
        : null;

  if (!route || !route.startsWith("/")) {
    return null;
  }

  return route;
}
