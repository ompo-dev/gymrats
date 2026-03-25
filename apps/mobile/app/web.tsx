import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { SecondaryButton } from "../src/components/buttons";
import { NativeLoadingScreen } from "../src/components/native-loading-screen";
import { ScreenBackground } from "../src/components/screen-background";
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
import { colors, radius, shadow, spacing, typography } from "../src/theme";
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

export default function WebScreen() {
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
    <ScreenBackground>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <View style={styles.webViewWrapper}>
          <WebView
            allowsBackForwardNavigationGestures
            domStorageEnabled
            injectedJavaScriptBeforeContentLoaded={
              injectedJavaScriptBeforeContentLoaded
            }
            javaScriptEnabled
            key={`${webViewKey}:${session.token ?? "guest"}`}
            onError={(event) => {
              setErrorMessage(
                event.nativeEvent.description || "Erro ao abrir a plataforma.",
              );
            }}
            onLoadEnd={() => {
              setIsPageLoading(false);
              void emitCurrentBridgeState();
            }}
            onLoadStart={() => {
              setIsPageLoading(true);
            }}
            onMessage={handleMessage}
            onNavigationStateChange={handleNavigationChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            originWhitelist={allowedOrigins}
            ref={webViewRef}
            setSupportMultipleWindows={false}
            sharedCookiesEnabled
            source={{
              uri: initialUrl,
              headers: session.token
                ? {
                    Authorization: `Bearer ${session.token}`,
                  }
                : undefined,
            }}
            startInLoadingState
            thirdPartyCookiesEnabled
          />

          <Pressable
            hitSlop={12}
            onPress={() => router.push("/settings")}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsButtonText}>Ajustes</Text>
          </Pressable>

          {(isPageLoading || isAuthBusy) && !errorMessage ? (
            <View style={styles.overlay}>
              <View style={styles.overlayCard}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.overlayTitle}>
                  {isAuthBusy
                    ? "Conectando sua conta..."
                    : "Carregando plataforma..."}
                </Text>
                <Text style={styles.overlayDescription}>
                  {isAuthBusy
                    ? "Validando sessao e preparando o GymRats."
                    : "Sincronizando a experiencia 1:1 com a versao web."}
                </Text>
              </View>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.overlay}>
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>
                  Nao foi possivel abrir o app
                </Text>
                <Text style={styles.errorDescription}>{errorMessage}</Text>
                <SecondaryButton onPress={reloadApp} title="Tentar novamente" />
              </View>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webViewWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  settingsButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(247, 247, 240, 0.92)",
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 2,
    marginRight: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
    ...shadow.soft,
  },
  settingsButtonText: {
    color: colors.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "800",
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(247, 247, 240, 0.82)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 15,
  },
  overlayCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.sm,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    ...shadow.soft,
  },
  overlayTitle: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "900",
    textAlign: "center",
  },
  overlayDescription: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
    textAlign: "center",
  },
  errorCard: {
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.md,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: "84%",
    ...shadow.soft,
  },
  errorTitle: {
    color: colors.foreground,
    fontSize: typography.heading.fontSize,
    fontWeight: "900",
    textAlign: "center",
  },
  errorDescription: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    textAlign: "center",
  },
});
