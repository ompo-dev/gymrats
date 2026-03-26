import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { NativeLoadingScreen } from "../src/components/native-loading-screen";
import { NativeWebShellScreen } from "../src/screens/web/native-web-shell-screen";
import {
  consumeOneTimeToken,
  isAuthCallbackUrl,
  startGoogleAuthSession,
} from "../src/lib/auth";
import { getNativeCapabilities } from "../src/lib/device-capabilities";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStateSnapshot,
  openPushSystemSettings,
  unlinkPushInstallationForLogout,
} from "../src/lib/push";
import { readNativeNamespace, writeNativeNamespace } from "../src/lib/storage";
import {
  buildBridgeEventScript,
  buildBridgeResponseScript,
  buildInjectedBootstrapScript,
  parseBridgeMessage,
} from "../src/lib/webview-bridge";
import {
  clearWidgetSnapshot,
  configureWidgetPreset,
  getWidgetStateSnapshot,
  refreshWidgetSnapshot,
} from "../src/lib/widget";
import { useAppStore } from "../src/store/app-store";
import type {
  NativeBridgeEventType,
  NativeBridgeRequestMessage,
  NativeStorageNamespace,
  WebBridgeMessage,
  WidgetPreset,
} from "../src/store/types";
import { getRoleHomePath } from "../src/utils/role";
import {
  getUrlOrigin,
  isAllowedWebViewUrl,
  isSameHost,
  normalizeUrl,
} from "../src/utils/url";

function isWidgetPreset(value: unknown): value is WidgetPreset {
  return value === "home" || value === "workout" || value === "nutrition";
}

function isNativeStorageNamespace(
  value: unknown,
): value is NativeStorageNamespace {
  return (
    value === "preferences" || value === "notification" || value === "widget"
  );
}

function isNativeBridgeRequestMessage(
  message: WebBridgeMessage,
): message is NativeBridgeRequestMessage {
  return (
    "channel" in message &&
    message.channel === "bridge-request" &&
    "id" in message &&
    typeof message.id === "string"
  );
}

export default function WebRoute() {
  const params = useLocalSearchParams<{
    path?: string | string[];
  }>();
  const config = useAppStore((state) => state.config);
  const session = useAppStore((state) => state.session);
  const upsertSession = useAppStore((state) => state.upsertSession);
  const clearSession = useAppStore((state) => state.clearSession);
  const hydrated = useAppStore((state) => state.hydrated);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [webViewKey, setWebViewKey] = useState(0);
  const webViewRef = useRef<WebView>(null);

  const nativeCapabilities = useMemo(() => getNativeCapabilities(), []);

  const allowedHosts = useMemo(
    () => [config.webUrl, config.apiUrl].filter(Boolean),
    [config.apiUrl, config.webUrl],
  );
  const allowedOrigins = useMemo(() => {
    const origins = allowedHosts
      .map((url) => getUrlOrigin(url))
      .filter(Boolean);
    return [...new Set([...origins, "gymrats-mobile://*"])];
  }, [allowedHosts]);

  const initialUrl = useMemo(() => {
    const forcedPath = Array.isArray(params.path)
      ? params.path[0]
      : params.path;
    const rolePath = getRoleHomePath(session.user?.role ?? null);
    const baseUrl = normalizeUrl(config.webUrl);
    const resolvedPath =
      typeof forcedPath === "string" && forcedPath.startsWith("/")
        ? forcedPath
        : rolePath;
    return resolvedPath ? `${baseUrl}${resolvedPath}` : `${baseUrl}/welcome`;
  }, [config.webUrl, params.path, session.user?.role]);

  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () =>
      buildInjectedBootstrapScript({
        apiUrl: config.apiUrl,
        token: session.token,
        debugToolsEnabled: nativeCapabilities.debugToolsEnabled,
      }),
    [config.apiUrl, nativeCapabilities.debugToolsEnabled, session.token],
  );

  const emitBridgeEvent = useCallback(
    (type: NativeBridgeEventType, payload?: unknown) => {
      webViewRef.current?.injectJavaScript(
        buildBridgeEventScript({
          channel: "bridge-event",
          type,
          payload,
        }),
      );
    },
    [],
  );

  const emitCurrentBridgeState = useCallback(async () => {
    emitBridgeEvent("capabilities.state", nativeCapabilities);
    emitBridgeEvent("push.state", await getPushStateSnapshot());
    emitBridgeEvent("widget.state", await getWidgetStateSnapshot());
  }, [emitBridgeEvent, nativeCapabilities]);

  const sendBridgeResponse = useCallback(
    (message: {
      id: string;
      type: NativeBridgeRequestMessage["type"];
      ok: boolean;
      payload?: unknown;
      error?: string;
    }) => {
      webViewRef.current?.injectJavaScript(
        buildBridgeResponseScript({
          channel: "bridge-response",
          id: message.id,
          type: message.type,
          ok: message.ok,
          payload: message.payload,
          error: message.error,
        }),
      );
    },
    [],
  );

  const reloadApp = useCallback(() => {
    setErrorMessage("");
    setWebViewKey((value) => value + 1);
  }, []);

  const handleGoogleAuth = useCallback(async () => {
    setErrorMessage("");
    setIsAuthBusy(true);

    try {
      const authResult = await startGoogleAuthSession(config);
      await upsertSession(authResult);
      router.replace("/web");
    } catch (authError) {
      setErrorMessage(
        authError instanceof Error
          ? authError.message
          : "Nao foi possivel concluir o login com Google.",
      );
    } finally {
      setIsAuthBusy(false);
    }
  }, [config, upsertSession]);

  const handleDeepLinkCallback = useCallback(
    async (requestUrl: string) => {
      const parsed = new URL(requestUrl);
      const token =
        parsed.searchParams.get("oneTimeToken") ||
        parsed.searchParams.get("token");
      const hasError = parsed.searchParams.get("error");

      if (hasError) {
        setErrorMessage("Erro ao autenticar com Google.");
        return;
      }

      if (!token) {
        return;
      }

      setIsAuthBusy(true);

      try {
        const authResult = await consumeOneTimeToken(config.apiUrl, token);
        await upsertSession(authResult);
        router.replace("/web");
      } catch (callbackError) {
        setErrorMessage(
          callbackError instanceof Error
            ? callbackError.message
            : "Nao foi possivel concluir o login.",
        );
      } finally {
        setIsAuthBusy(false);
      }
    },
    [config.apiUrl, upsertSession],
  );

  const handleBridgeRequest = useCallback(
    async (message: NativeBridgeRequestMessage) => {
      try {
        if (message.type === "capabilities.get") {
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: nativeCapabilities,
          });
          return;
        }

        if (message.type === "push.status") {
          const state = await getPushStateSnapshot();
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: state,
          });
          emitBridgeEvent("push.state", state);
          return;
        }

        if (message.type === "push.enable") {
          if (!session.token) {
            throw new Error("Usuario nao autenticado para registrar push.");
          }

          const state = await enablePushNotifications({
            apiUrl: config.apiUrl,
            sessionToken: session.token,
            capabilities: nativeCapabilities,
          });
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: state,
          });
          emitBridgeEvent("push.state", state);
          emitBridgeEvent("push.registered", state);
          return;
        }

        if (message.type === "push.disable") {
          const state = await disablePushNotifications({
            apiUrl: config.apiUrl,
            sessionToken: session.token,
          });
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: state,
          });
          emitBridgeEvent("push.state", state);
          return;
        }

        if (message.type === "push.openSettings") {
          await openPushSystemSettings();
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: { opened: true },
          });
          return;
        }

        if (message.type === "widget.status") {
          const state = await getWidgetStateSnapshot();
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: state,
          });
          emitBridgeEvent("widget.state", state);
          return;
        }

        if (message.type === "widget.configure") {
          const preset = (message.payload as { preset?: unknown } | undefined)
            ?.preset;
          if (!isWidgetPreset(preset)) {
            throw new Error("Preset de widget invalido.");
          }

          const state = await configureWidgetPreset(preset);
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: state,
          });
          emitBridgeEvent("widget.state", state);
          return;
        }

        if (message.type === "widget.refresh") {
          const state = await refreshWidgetSnapshot(session.user ?? null);
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: state,
          });
          emitBridgeEvent("widget.state", state);
          return;
        }

        if (message.type === "widget.clear") {
          const state = await clearWidgetSnapshot();
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: state,
          });
          emitBridgeEvent("widget.state", state);
          return;
        }

        if (message.type === "storage.get") {
          const namespace = (
            message.payload as { namespace?: unknown } | undefined
          )?.namespace;
          if (!isNativeStorageNamespace(namespace)) {
            throw new Error("Namespace de storage invalido.");
          }

          const value = await readNativeNamespace(namespace);
          const payload = {
            namespace,
            value,
          };
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload,
          });
          emitBridgeEvent("storage.result", payload);
          return;
        }

        if (message.type === "storage.set") {
          const payload = message.payload as
            | { namespace?: unknown; value?: unknown }
            | undefined;
          if (!isNativeStorageNamespace(payload?.namespace)) {
            throw new Error("Namespace de storage invalido.");
          }

          await writeNativeNamespace(payload.namespace, payload.value ?? null);
          const result = {
            namespace: payload.namespace,
            value: payload.value ?? null,
          };
          sendBridgeResponse({
            id: message.id,
            type: message.type,
            ok: true,
            payload: result,
          });
          emitBridgeEvent("storage.result", result);
          return;
        }

        throw new Error("Mensagem de bridge nao suportada.");
      } catch (error) {
        sendBridgeResponse({
          id: message.id,
          type: message.type,
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Falha ao processar a bridge nativa.",
        });
      }
    },
    [
      config.apiUrl,
      emitBridgeEvent,
      nativeCapabilities,
      sendBridgeResponse,
      session.token,
      session.user,
    ],
  );

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      const url = request.url;

      if (!url) {
        return false;
      }

      if (isAuthCallbackUrl(url)) {
        void handleDeepLinkCallback(url);
        return false;
      }

      try {
        const parsed = new URL(url);

        if (
          parsed.pathname === "/api/auth/google/start" &&
          (isSameHost(url, config.apiUrl) || isSameHost(url, config.webUrl))
        ) {
          void handleGoogleAuth();
          return false;
        }

        if (parsed.protocol === "mailto:" || parsed.protocol === "tel:") {
          void Linking.openURL(url);
          return false;
        }

        if (
          (parsed.protocol === "http:" || parsed.protocol === "https:") &&
          !isAllowedWebViewUrl(url, allowedHosts)
        ) {
          void Linking.openURL(url);
          return false;
        }
      } catch {
        return true;
      }

      return true;
    },
    [
      allowedHosts,
      config.apiUrl,
      config.webUrl,
      handleDeepLinkCallback,
      handleGoogleAuth,
    ],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseBridgeMessage(event.nativeEvent.data);
      if (!message) {
        return;
      }

      if (message.type === "auth-state" && !message.hasToken && session.token) {
        void unlinkPushInstallationForLogout({
          apiUrl: config.apiUrl,
          sessionToken: session.token,
        }).finally(() => {
          void clearSession();
        });
        return;
      }

      if (isNativeBridgeRequestMessage(message)) {
        void handleBridgeRequest(message);
      }
    },
    [clearSession, config.apiUrl, handleBridgeRequest, session.token],
  );

  const handleNavigationChange = useCallback(
    (navigation: WebViewNavigation) => {
      if (!navigation.loading) {
        setIsPageLoading(false);
      }
    },
    [],
  );

  if (!hydrated) {
    return <NativeLoadingScreen message="Iniciando GymRats Mobile..." />;
  }

  return (
    <NativeWebShellScreen
      webViewRef={webViewRef}
      webViewKey={`${webViewKey}:${session.token ?? "guest"}`}
      initialUrl={initialUrl}
      injectedJavaScriptBeforeContentLoaded={
        injectedJavaScriptBeforeContentLoaded
      }
      allowedOrigins={allowedOrigins}
      sessionToken={session.token}
      isPageLoading={isPageLoading}
      isAuthBusy={isAuthBusy}
      errorMessage={errorMessage}
      onError={(event) => {
        setErrorMessage(
          event.nativeEvent.description || "Erro ao abrir a plataforma.",
        );
      }}
      onMessage={handleMessage}
      onLoadStart={() => {
        setIsPageLoading(true);
      }}
      onLoadEnd={() => {
        setIsPageLoading(false);
        void emitCurrentBridgeState();
      }}
      onNavigationStateChange={handleNavigationChange}
      onShouldStartLoadWithRequest={handleShouldStartLoad}
      onOpenSettings={() => router.push("/settings")}
      onReload={reloadApp}
    />
  );
}
