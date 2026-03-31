import type { RefObject } from "react";
import {
  ActivityIndicator,
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
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
} from "react-native-webview/lib/WebViewTypes";
import { SecondaryButton } from "../../components/buttons";
import { ScreenBackground } from "../../components/screen-background";
import { colors, radius, shadow, spacing, typography } from "../../theme";

interface NativeWebShellScreenProps {
  webViewRef: RefObject<WebView | null>;
  webViewKey: string;
  initialUrl: string;
  injectedJavaScriptBeforeContentLoaded: string;
  allowedOrigins: string[];
  sessionToken?: string | null;
  isPageLoading: boolean;
  isAuthBusy: boolean;
  errorMessage: string;
  onError: (event: WebViewErrorEvent) => void;
  onMessage: (event: WebViewMessageEvent) => void;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onNavigationStateChange: (navigation: WebViewNavigation) => void;
  onShouldStartLoadWithRequest: (request: ShouldStartLoadRequest) => boolean;
  onOpenSettings: () => void;
  onReload: () => void;
}

export function NativeWebShellScreen({
  webViewRef,
  webViewKey,
  initialUrl,
  injectedJavaScriptBeforeContentLoaded,
  allowedOrigins,
  sessionToken,
  isPageLoading,
  isAuthBusy,
  errorMessage,
  onError,
  onMessage,
  onLoadStart,
  onLoadEnd,
  onNavigationStateChange,
  onShouldStartLoadWithRequest,
  onOpenSettings,
  onReload,
}: NativeWebShellScreenProps) {
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
            key={webViewKey}
            onError={onError}
            onLoadEnd={onLoadEnd}
            onLoadStart={onLoadStart}
            onMessage={onMessage}
            onNavigationStateChange={onNavigationStateChange}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            originWhitelist={allowedOrigins}
            ref={webViewRef}
            setSupportMultipleWindows={false}
            sharedCookiesEnabled
            source={{
              uri: initialUrl,
              headers: sessionToken
                ? {
                    Authorization: `Bearer ${sessionToken}`,
                  }
                : undefined,
            }}
            startInLoadingState
            thirdPartyCookiesEnabled
          />

          <Pressable
            hitSlop={12}
            onPress={onOpenSettings}
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
                <SecondaryButton onPress={onReload} title="Tentar novamente" />
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
