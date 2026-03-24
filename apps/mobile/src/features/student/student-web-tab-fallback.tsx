import { router } from "expo-router";
import { View, StyleSheet } from "react-native";
import {
  type WebViewMessageEvent,
  type WebViewNavigation,
  WebView,
} from "react-native-webview";
import { buildInjectedBootstrapScript, parseBridgeMessage } from "../../lib/webview-bridge";
import { useAppStore } from "../../store/app-store";

type StudentWebTabFallbackProps = {
  params: Record<string, string | string[] | undefined>;
  tab: string;
};

export function StudentWebTabFallback({
  params,
  tab,
}: StudentWebTabFallbackProps) {
  const config = useAppStore((state) => state.config);
  const session = useAppStore((state) => state.session);
  const clearSession = useAppStore((state) => state.clearSession);

  const query = new URLSearchParams();
  query.set("tab", tab);

  Object.entries(params).forEach(([key, value]) => {
    if (key === "tab" || value == null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
      return;
    }

    query.set(key, value);
  });

  const uri = `${config.webUrl}/student?${query.toString()}`;
  const injectedScript = `${buildInjectedBootstrapScript({
    apiUrl: config.apiUrl,
    token: session.token,
  })};(function(){function hideShell(){var header=document.querySelector('header'); if(header){header.style.display='none';} var nav=document.querySelector('nav'); if(nav){nav.style.display='none';} if(document.body){document.body.style.paddingTop='0px'; document.body.style.paddingBottom='0px';}} hideShell(); document.addEventListener('DOMContentLoaded', hideShell); setTimeout(hideShell, 300); true;})();`;

  return (
    <View style={styles.container}>
      <WebView
        domStorageEnabled
        injectedJavaScriptBeforeContentLoaded={injectedScript}
        javaScriptEnabled
        onMessage={(event: WebViewMessageEvent) => {
          const message = parseBridgeMessage(event.nativeEvent.data);
          if (message?.type === "auth-state" && !message.hasToken && session.token) {
            void clearSession();
            router.replace("/web");
          }
        }}
        onNavigationStateChange={(navigation: WebViewNavigation) => {
          if (navigation.url.includes("/welcome")) {
            void clearSession();
            router.replace("/web");
          }
        }}
        originWhitelist={["*"]}
        sharedCookiesEnabled
        source={{
          uri,
          headers: session.token
            ? {
                Authorization: `Bearer ${session.token}`,
              }
            : undefined,
        }}
        startInLoadingState
        thirdPartyCookiesEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
});
