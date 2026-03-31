export function normalizeUrl(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function getUrlOrigin(value?: string | null) {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    return "";
  }

  try {
    return new URL(normalized).origin;
  } catch {
    return "";
  }
}

export function isSameHost(firstUrl: string, secondUrl: string) {
  try {
    return new URL(firstUrl).host === new URL(secondUrl).host;
  } catch {
    return false;
  }
}

export function isAllowedWebViewUrl(url: string, allowedUrls: string[]) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === "about:" || parsedUrl.protocol === "data:") {
      return true;
    }

    return allowedUrls.some((allowedUrl) => isSameHost(url, allowedUrl));
  } catch {
    return false;
  }
}
