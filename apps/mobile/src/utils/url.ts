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

export function isSameHost(firstUrl: string, secondUrl: string) {
  try {
    return new URL(firstUrl).host === new URL(secondUrl).host;
  } catch {
    return false;
  }
}
