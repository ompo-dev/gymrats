import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { refreshAuthSession } from "../src/lib/auth";
import { getNativeCapabilities } from "../src/lib/device-capabilities";
import { signOutRemoteSession } from "../src/lib/native-api";
import {
  disablePushNotifications,
  enablePushNotifications,
  getDebugPushMetadata,
  getPushStateSnapshot,
  getShortPushToken,
  openPushSystemSettings,
  sendPushTest,
  unlinkPushInstallationForLogout,
} from "../src/lib/push";
import { isDebugToolsEnabled } from "../src/lib/runtime";
import {
  clearWidgetSnapshot,
  configureWidgetPreset,
  getWidgetStateSnapshot,
  refreshWidgetSnapshot,
} from "../src/lib/widget";
import { NativeSettingsScreen } from "../src/screens/settings/native-settings-screen";
import { useAppStore } from "../src/store/app-store";
import type {
  StoredPushState,
  StoredWidgetState,
  WidgetPreset,
} from "../src/store/types";
import { normalizeUrl } from "../src/utils/url";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Nunca";
  }

  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return value;
  }
}

function getPermissionLabel(status: StoredPushState["permissionStatus"]) {
  switch (status) {
    case "granted":
      return "Concedida";
    case "provisional":
      return "Provisional";
    case "denied":
      return "Negada";
    case "unsupported":
      return "Indisponivel";
    default:
      return "Nao solicitada";
  }
}

function getRegistrationLabel(status: StoredPushState["registrationStatus"]) {
  switch (status) {
    case "registered":
      return "Registrado";
    case "registering":
      return "Registrando";
    case "error":
      return "Erro";
    default:
      return "Nao registrado";
  }
}

function getWidgetStatusLabel(state: StoredWidgetState) {
  if (state.lastSnapshotStatus === "updated") {
    return "Atualizado";
  }

  if (state.lastSnapshotStatus === "error") {
    return "Erro";
  }

  return "Nunca sincronizado";
}

function getRoleLabel(role?: string | null) {
  if (!role) {
    return "Sem sessao";
  }

  return role;
}

export default function SettingsScreen() {
  const router = useRouter();
  const config = useAppStore((state) => state.config);
  const updateConfig = useAppStore((state) => state.updateConfig);
  const upsertSession = useAppStore((state) => state.upsertSession);
  const clearSession = useAppStore((state) => state.clearSession);
  const session = useAppStore((state) => state.session);

  const [webUrl, setWebUrl] = useState(config.webUrl);
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [manualToken, setManualToken] = useState(session.token ?? "");
  const [pushState, setPushState] = useState<StoredPushState>({
    enabled: false,
    installationId: null,
    expoPushToken: null,
    permissionStatus: "undetermined",
    registrationStatus: "unregistered",
    lastError: null,
    lastSyncAt: null,
  });
  const [widgetState, setWidgetState] = useState<StoredWidgetState>({
    preset: "home",
    supportStatus: "unavailable",
    supportReason: "Carregando estado do widget...",
    lastSnapshotAt: null,
    lastSnapshotStatus: "never",
    lastError: null,
    snapshot: null,
  });
  const [isLoadingNativeState, setIsLoadingNativeState] = useState(true);
  const [isSavingEnvironment, setIsSavingEnvironment] = useState(false);
  const [isImportingToken, setIsImportingToken] = useState(false);
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const [isUpdatingWidget, setIsUpdatingWidget] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const resolvedHosts = useMemo(
    () => ({
      web: normalizeUrl(webUrl),
      api: normalizeUrl(apiUrl),
    }),
    [apiUrl, webUrl],
  );

  const nativeCapabilities = useMemo(() => getNativeCapabilities(), []);
  const debugToolsEnabled = isDebugToolsEnabled();
  const canShowQaControls = debugToolsEnabled || session.user?.role === "ADMIN";
  const pushDebugMetadata = useMemo(() => getDebugPushMetadata(), []);

  const loadNativeState = useCallback(async () => {
    setIsLoadingNativeState(true);

    try {
      const [nextPushState, nextWidgetState] = await Promise.all([
        getPushStateSnapshot(),
        getWidgetStateSnapshot(),
      ]);
      setPushState(nextPushState);
      setWidgetState(nextWidgetState);
    } finally {
      setIsLoadingNativeState(false);
    }
  }, []);

  useEffect(() => {
    void loadNativeState();
  }, [loadNativeState]);

  const handleSaveEnvironment = async () => {
    setError("");
    setNotice("");

    if (!resolvedHosts.web || !resolvedHosts.api) {
      setError("Informe URLs validas para web e API.");
      return;
    }

    setIsSavingEnvironment(true);

    try {
      await updateConfig({
        webUrl: resolvedHosts.web,
        apiUrl: resolvedHosts.api,
      });
      setNotice("Ambiente mobile atualizado.");
      router.replace("/web");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nao foi possivel salvar a configuracao.",
      );
    } finally {
      setIsSavingEnvironment(false);
    }
  };

  const handleManualTokenLogin = async () => {
    setError("");
    setNotice("");

    const normalizedApiUrl = normalizeUrl(apiUrl);
    const trimmedToken = manualToken.trim();

    if (!normalizedApiUrl) {
      setError("Informe uma URL valida para a API antes de usar o token.");
      return;
    }

    if (!trimmedToken) {
      setError("Cole um token valido para entrar manualmente.");
      return;
    }

    setIsImportingToken(true);

    try {
      if (
        resolvedHosts.web &&
        resolvedHosts.api &&
        (resolvedHosts.web !== config.webUrl ||
          resolvedHosts.api !== config.apiUrl)
      ) {
        await updateConfig({
          webUrl: resolvedHosts.web,
          apiUrl: resolvedHosts.api,
        });
      }

      const payload = await refreshAuthSession(normalizedApiUrl, trimmedToken);
      await upsertSession(payload);
      setNotice("Sessao importada com sucesso.");
      router.replace("/web");
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Nao foi possivel validar o token informado.",
      );
    } finally {
      setIsImportingToken(false);
    }
  };

  const handlePushToggle = async (nextValue: boolean) => {
    setError("");
    setNotice("");

    if (nextValue && !session.token) {
      setError("Entre na sua conta para controlar push neste dispositivo.");
      return;
    }

    const sessionToken = session.token;
    setIsUpdatingPush(true);

    try {
      const nextState = nextValue
        ? await enablePushNotifications({
            apiUrl: config.apiUrl,
            sessionToken: sessionToken!,
            capabilities: nativeCapabilities,
          })
        : await disablePushNotifications({
            apiUrl: config.apiUrl,
            sessionToken,
          });

      setPushState(nextState);
      setNotice(
        nextValue
          ? "Notificacoes ativadas neste dispositivo."
          : "Notificacoes desativadas neste dispositivo.",
      );
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : "Nao foi possivel atualizar push.",
      );
      setPushState(await getPushStateSnapshot());
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleReRegisterPush = async () => {
    if (!session.token) {
      setError("Entre na sua conta para registrar push.");
      return;
    }

    setIsUpdatingPush(true);
    setError("");
    setNotice("");

    try {
      const nextState = await enablePushNotifications({
        apiUrl: config.apiUrl,
        sessionToken: session.token,
        capabilities: nativeCapabilities,
      });
      setPushState(nextState);
      setNotice("Registro de push atualizado.");
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : "Nao foi possivel reativar o registro.",
      );
      setPushState(await getPushStateSnapshot());
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleSendPushTest = async () => {
    if (!session.token) {
      setError("Entre na sua conta para enviar o push de teste.");
      return;
    }

    setIsUpdatingPush(true);
    setError("");
    setNotice("");

    try {
      await sendPushTest({
        apiUrl: config.apiUrl,
        sessionToken: session.token,
        route:
          session.user?.role === "GYM"
            ? "/gym"
            : session.user?.role === "PERSONAL"
              ? "/personal"
              : "/student",
      });
      setNotice("Push de teste enviado para este dispositivo.");
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : "Nao foi possivel enviar o push de teste.",
      );
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleWidgetPresetChange = async (preset: WidgetPreset) => {
    setIsUpdatingWidget(true);
    setError("");
    setNotice("");

    try {
      const nextState = await configureWidgetPreset(preset);
      setWidgetState(nextState);
      setNotice("Preset padrao do widget atualizado.");
    } catch (widgetError) {
      setError(
        widgetError instanceof Error
          ? widgetError.message
          : "Nao foi possivel atualizar o preset do widget.",
      );
    } finally {
      setIsUpdatingWidget(false);
    }
  };

  const handleRefreshWidgetSnapshot = async () => {
    setIsUpdatingWidget(true);
    setError("");
    setNotice("");

    try {
      const nextState = await refreshWidgetSnapshot(session.user ?? null);
      setWidgetState(nextState);
      setNotice("Snapshot local do widget atualizado.");
    } catch (widgetError) {
      setError(
        widgetError instanceof Error
          ? widgetError.message
          : "Nao foi possivel atualizar o widget.",
      );
    } finally {
      setIsUpdatingWidget(false);
    }
  };

  const handleClearWidgetSnapshot = async () => {
    setIsUpdatingWidget(true);
    setError("");
    setNotice("");

    try {
      const nextState = await clearWidgetSnapshot();
      setWidgetState(nextState);
      setNotice("Dados locais do widget removidos.");
    } catch (widgetError) {
      setError(
        widgetError instanceof Error
          ? widgetError.message
          : "Nao foi possivel limpar os dados do widget.",
      );
    } finally {
      setIsUpdatingWidget(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError("");
    setNotice("");

    try {
      if (session.token) {
        await unlinkPushInstallationForLogout({
          apiUrl: config.apiUrl,
          sessionToken: session.token,
        });

        try {
          await signOutRemoteSession(config.apiUrl, session.token);
        } catch {
          // Mantem o fluxo local mesmo se o backend falhar.
        }
      }

      await clearSession();
      setManualToken("");
      setPushState(await getPushStateSnapshot());
      setNotice("Sessao encerrada neste dispositivo.");
      router.replace("/web");
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Nao foi possivel encerrar a sessao.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <NativeSettingsScreen
      canShowQaControls={canShowQaControls}
      debugToolsEnabled={debugToolsEnabled}
      environmentSection={{
        apiUrl,
        isImportingToken,
        isSavingEnvironment,
        manualToken,
        webUrl,
        onApiUrlChange: setApiUrl,
        onManualTokenChange: setManualToken,
        onSaveEnvironment: () => {
          void handleSaveEnvironment();
        },
        onTokenLogin: () => {
          void handleManualTokenLogin();
        },
        onWebUrlChange: setWebUrl,
      }}
      error={error}
      isBusy={
        isLoadingNativeState ||
        isSavingEnvironment ||
        isImportingToken ||
        isUpdatingPush ||
        isUpdatingWidget ||
        isSigningOut
      }
      isSigningOut={isSigningOut}
      notice={notice}
      onBack={() => router.replace("/web")}
      onSignOut={() => {
        void handleSignOut();
      }}
      pushSection={{
        appVersion: pushDebugMetadata.appVersion,
        canShowQaControls,
        canToggle: nativeCapabilities.push.status === "supported",
        capabilityReason:
          nativeCapabilities.push.reason ||
          "O app vai registrar este aparelho no backend para alertas e navegacao por push.",
        installationId: pushState.installationId,
        isUpdating: isUpdatingPush,
        lastSyncAtLabel: formatDateTime(pushState.lastSyncAt),
        onOpenSystemSettings: () => {
          void openPushSystemSettings();
        },
        onReRegister: () => {
          void handleReRegisterPush();
        },
        onSendTest: () => {
          void handleSendPushTest();
        },
        onToggle: (value) => {
          void handlePushToggle(value);
        },
        permissionLabel: getPermissionLabel(pushState.permissionStatus),
        platform: pushDebugMetadata.platform,
        pushEnabled: pushState.enabled,
        pushLastError: pushState.lastError,
        pushToken: getShortPushToken(pushState.expoPushToken),
        registrationLabel: getRegistrationLabel(pushState.registrationStatus),
        showOpenSystemSettings: pushState.permissionStatus === "denied",
        showReRegister:
          pushState.enabled &&
          pushState.registrationStatus !== "registered",
      }}
      sessionEmail={session.user?.email || "Sem sessao"}
      sessionName={session.user ? session.user.name : "Nao autenticado"}
      sessionRoleLabel={getRoleLabel(session.user?.role)}
      sessionStatusLabel={
        session.token ? "Sincronizada" : "Nao autenticada"
      }
      widgetSection={{
        isUpdating: isUpdatingWidget,
        lastUpdatedLabel: formatDateTime(widgetState.lastSnapshotAt),
        onClearSnapshot: () => {
          void handleClearWidgetSnapshot();
        },
        onPresetChange: (preset) => {
          void handleWidgetPresetChange(preset);
        },
        onRefreshSnapshot: () => {
          void handleRefreshWidgetSnapshot();
        },
        preset: widgetState.preset,
        snapshot: widgetState.snapshot,
        statusLabel: getWidgetStatusLabel(widgetState),
        supportLabel:
          widgetState.supportStatus === "supported"
            ? "Suportado"
            : widgetState.supportStatus === "not-supported"
              ? "Nao suportado"
              : "Indisponivel neste build",
        supportReason: widgetState.supportReason,
      }}
    />
  );
}
