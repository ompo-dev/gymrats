import type { WebBridgeMessage } from "../store/types";

type BootstrapInput = {
  apiUrl: string;
  token: string | null;
};

export function buildInjectedBootstrapScript({
  apiUrl,
  token
}: BootstrapInput): string {
  const safeApiUrl = JSON.stringify(apiUrl);
  const safeToken = JSON.stringify(token);

  return `
    (function() {
      var API_URL = ${safeApiUrl};
      var TOKEN = ${safeToken};

      function notifyAuthState() {
        try {
          var currentToken = window.localStorage.getItem("auth_token");
          var payload = {
            type: "auth-state",
            href: window.location.href,
            hasToken: !!currentToken
          };
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        } catch (error) {}
      }

      function syncCookieFromToken(nextToken) {
        try {
          if (!nextToken) {
            document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
            return;
          }

          var secure = window.location.protocol === "https:" ? "; Secure" : "";
          document.cookie = "auth_token=" + encodeURIComponent(nextToken) + "; Path=/; Max-Age=2592000; SameSite=Lax" + secure;
        } catch (error) {}
      }

      try {
        window.__GYMRATS_API_URL__ = API_URL;
      } catch (error) {}

      try {
        if (document.documentElement) {
          document.documentElement.dataset.apiBaseUrl = API_URL;
        }
      } catch (error) {}

      document.addEventListener("DOMContentLoaded", function() {
        try {
          if (document.body) {
            document.body.dataset.apiBaseUrl = API_URL;
          }
        } catch (error) {}
      });

      try {
        if (TOKEN) {
          window.localStorage.setItem("auth_token", TOKEN);
          syncCookieFromToken(TOKEN);
        }
      } catch (error) {}

      try {
        var originalSetItem = window.localStorage.setItem.bind(window.localStorage);
        var originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage);
        window.localStorage.setItem = function(key, value) {
          originalSetItem(key, value);
          if (key === "auth_token") {
            syncCookieFromToken(value);
            notifyAuthState();
          }
        };
        window.localStorage.removeItem = function(key) {
          originalRemoveItem(key);
          if (key === "auth_token") {
            syncCookieFromToken("");
            notifyAuthState();
          }
        };
      } catch (error) {}

      try {
        window.open = function(url) {
          if (typeof url === "string") {
            window.location.href = url;
          }
          return null;
        };
      } catch (error) {}

      notifyAuthState();
      true;
    })();
  `;
}

export function parseBridgeMessage(raw: string): WebBridgeMessage | null {
  try {
    const parsed = JSON.parse(raw) as WebBridgeMessage;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
