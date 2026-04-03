import { isSameOriginApiBaseUrl, normalizeApiBaseUrl } from "./base-url";

type RuntimeWindow = Window & {
  __GYMRATS_API_URL__?: string;
};

function resolveRuntimePublicApiUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const runtimeWindow = window as RuntimeWindow;
  const windowUrl = normalizeApiBaseUrl(runtimeWindow.__GYMRATS_API_URL__);

  if (windowUrl) {
    return windowUrl;
  }

  const datasetUrl = normalizeApiBaseUrl(
    document.body?.dataset.apiBaseUrl ||
      document.documentElement?.dataset.apiBaseUrl,
  );

  if (datasetUrl) {
    return datasetUrl;
  }

  const metaUrl = normalizeApiBaseUrl(
    document
      .querySelector('meta[name="gymrats-api-base-url"]')
      ?.getAttribute("content") || undefined,
  );

  return metaUrl;
}

export function resolveApiBaseUrl(): string {
  const publicUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const internalUrl = normalizeApiBaseUrl(process.env.API_INTERNAL_URL);
  const authUrl = normalizeApiBaseUrl(process.env.BETTER_AUTH_URL);

  if (typeof window !== "undefined") {
    const browserBaseUrl =
      resolveRuntimePublicApiUrl() || publicUrl || authUrl || "";

    if (isSameOriginApiBaseUrl(browserBaseUrl)) {
      return window.location.origin;
    }

    return browserBaseUrl;
  }

  return internalUrl || publicUrl || authUrl || "http://localhost:4000";
}
