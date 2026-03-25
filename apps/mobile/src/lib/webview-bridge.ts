import type {
  NativeBridgeEventMessage,
  NativeBridgeResponseMessage,
  WebBridgeMessage,
} from "../store/types";

type BootstrapInput = {
  apiUrl: string;
  token: string | null;
  debugToolsEnabled: boolean;
};

function serializeInjectedMessage(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function buildDispatchScript(eventName: string, payload: unknown) {
  const safePayload = serializeInjectedMessage(payload);

  return `
    (function() {
      var detail = ${safePayload};
      function dispatch(name, value) {
        try {
          var event;
          if (typeof CustomEvent === "function") {
            event = new CustomEvent(name, { detail: value });
          } else {
            event = document.createEvent("CustomEvent");
            event.initCustomEvent(name, true, true, value);
          }
          window.dispatchEvent(event);
          document.dispatchEvent(event);
        } catch (error) {}
      }
      dispatch(${JSON.stringify(eventName)}, detail);
      true;
    })();
  `;
}

export function buildBridgeResponseScript(message: NativeBridgeResponseMessage) {
  return buildDispatchScript("gymrats-native-bridge-response", message);
}

export function buildBridgeEventScript(message: NativeBridgeEventMessage) {
  return buildDispatchScript("gymrats-native-bridge-event", message);
}

export function buildInjectedBootstrapScript({
  apiUrl,
  token,
  debugToolsEnabled,
}: BootstrapInput): string {
  const safeApiUrl = JSON.stringify(apiUrl);
  const safeToken = JSON.stringify(token);
  const safeDebugToolsEnabled = JSON.stringify(debugToolsEnabled);

  return `
    (function() {
      var API_URL = ${safeApiUrl};
      var TOKEN = ${safeToken};
      var DEBUG_TOOLS_ENABLED = ${safeDebugToolsEnabled};
      var bridgePendingRequests = Object.create(null);

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

      function dispatchBridgeEvent(name, detail) {
        try {
          var event;
          if (typeof CustomEvent === "function") {
            event = new CustomEvent(name, { detail: detail });
          } else {
            event = document.createEvent("CustomEvent");
            event.initCustomEvent(name, true, true, detail);
          }
          window.dispatchEvent(event);
          document.dispatchEvent(event);
        } catch (error) {}
      }

      function postBridgeRequest(type, payload) {
        var requestId = "bridge-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
        var message = {
          channel: "bridge-request",
          id: requestId,
          type: type,
          payload: payload
        };

        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(message));

        return new Promise(function(resolve, reject) {
          bridgePendingRequests[requestId] = {
            resolve: resolve,
            reject: reject
          };

          setTimeout(function() {
            if (!bridgePendingRequests[requestId]) {
              return;
            }

            delete bridgePendingRequests[requestId];
            reject(new Error("Native bridge timeout"));
          }, 10000);
        });
      }

      try {
        window.GymRatsNativeBridge = {
          version: 1,
          debugToolsEnabled: DEBUG_TOOLS_ENABLED,
          invoke: function(type, payload) {
            return postBridgeRequest(type, payload);
          },
          emit: function(type, payload) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              channel: "bridge-request",
              id: "bridge-fire-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10),
              type: type,
              payload: payload
            }));
          }
        };
      } catch (error) {}

      window.addEventListener("gymrats-native-bridge-response", function(event) {
        try {
          var message = event && event.detail ? event.detail : null;
          if (!message || message.channel !== "bridge-response") {
            return;
          }

          var pending = bridgePendingRequests[message.id];
          if (!pending) {
            return;
          }

          delete bridgePendingRequests[message.id];
          if (message.ok) {
            pending.resolve(message.payload);
            return;
          }

          pending.reject(new Error(message.error || "Native bridge error"));
        } catch (error) {}
      });

      try {
        window.__GYMRATS_API_URL__ = API_URL;
        window.__GYMRATS_MOBILE_DEBUG__ = DEBUG_TOOLS_ENABLED;
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

      dispatchBridgeEvent("gymrats-native-bridge-event", {
        channel: "bridge-event",
        type: "capabilities.state",
        payload: {
          bridgeVersion: 1,
          debugToolsEnabled: DEBUG_TOOLS_ENABLED
        }
      });
      notifyAuthState();
      true;
    })();
  `;
}

export function parseBridgeMessage(raw: string): WebBridgeMessage | null {
  try {
    const parsed = JSON.parse(raw) as WebBridgeMessage;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
