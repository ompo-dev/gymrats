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

export function buildBridgeResponseScript(
  message: NativeBridgeResponseMessage,
) {
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

      function setNativeAuthHint(isActive) {
        try {
          window.__GYMRATS_NATIVE_AUTH_ACTIVE__ = !!isActive;
        } catch (error) {}
      }

      function setNativeToken(nextToken) {
        TOKEN = nextToken || null;
        setNativeAuthHint(!!TOKEN);
      }

      function notifyAuthState() {
        try {
          var payload = {
            type: "auth-state",
            href: window.location.href,
            hasToken: !!TOKEN
          };
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        } catch (error) {}
      }

      function resolveRequestUrl(input) {
        try {
          return new URL(String(input), window.location.href);
        } catch (error) {
          return null;
        }
      }

      function resolveApiOrigin() {
        try {
          return API_URL ? new URL(API_URL, window.location.href).origin : null;
        } catch (error) {
          return null;
        }
      }

      function isApiRequest(input) {
        var parsedUrl = resolveRequestUrl(input);
        if (!parsedUrl) {
          return false;
        }

        if (parsedUrl.origin === window.location.origin && parsedUrl.pathname.indexOf("/api/") === 0) {
          return true;
        }

        var apiOrigin = resolveApiOrigin();
        return !!apiOrigin && parsedUrl.origin === apiOrigin && parsedUrl.pathname.indexOf("/api/") === 0;
      }

      function withAuthorizationHeader(headersLike) {
        var headers = new Headers(headersLike || {});
        if (TOKEN && !headers.has("Authorization")) {
          headers.set("Authorization", "Bearer " + TOKEN);
        }
        return headers;
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
        setNativeAuthHint(!!TOKEN);
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
        var originalFetch = window.fetch ? window.fetch.bind(window) : null;
        if (originalFetch) {
          window.fetch = function(input, init) {
            var requestUrl =
              typeof input === "string" || input instanceof URL
                ? input
                : input && typeof input.url === "string"
                  ? input.url
                  : "";

            if (!TOKEN || !isApiRequest(requestUrl)) {
              return originalFetch(input, init);
            }

            var nextInit = init ? Object.assign({}, init) : {};
            nextInit.headers = withAuthorizationHeader(
              init && init.headers
                ? init.headers
                : input && input.headers
                  ? input.headers
                  : undefined
            );

            if (typeof Request === "function" && input instanceof Request) {
              return originalFetch(new Request(input, nextInit));
            }

            return originalFetch(input, nextInit);
          };
        }
      } catch (error) {}

      try {
        var originalOpen = XMLHttpRequest.prototype.open;
        var originalSend = XMLHttpRequest.prototype.send;
        var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

        XMLHttpRequest.prototype.open = function(method, url) {
          this.__gymratsRequestUrl = url;
          this.__gymratsHasAuthorization = false;
          return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
          if (String(name).toLowerCase() === "authorization") {
            this.__gymratsHasAuthorization = true;
          }
          return originalSetRequestHeader.call(this, name, value);
        };

        XMLHttpRequest.prototype.send = function(body) {
          if (
            TOKEN &&
            !this.__gymratsHasAuthorization &&
            isApiRequest(this.__gymratsRequestUrl || "")
          ) {
            originalSetRequestHeader.call(this, "Authorization", "Bearer " + TOKEN);
          }

          return originalSend.call(this, body);
        };
      } catch (error) {}

      try {
        window.addEventListener("gymrats-auth-token-set", function(event) {
          var nextToken =
            event && event.detail && typeof event.detail.token === "string"
              ? event.detail.token
              : null;

          setNativeToken(nextToken);
          notifyAuthState();
        });

        window.addEventListener("gymrats-auth-token-clear", function() {
          setNativeToken(null);
          notifyAuthState();
        });
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
