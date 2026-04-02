type ResolveSafeRedirectTargetInput = {
  candidate?: string | null;
  fallback: string;
  appUrl: string;
  requestOrigin: string;
  trustedOrigins?: string;
};

function normalizeOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

function buildAllowedOrigins({
  appUrl,
  requestOrigin,
  trustedOrigins,
}: Omit<ResolveSafeRedirectTargetInput, "candidate" | "fallback">): Set<string> {
  const allowed = new Set<string>();

  for (const value of [appUrl, requestOrigin]) {
    const origin = normalizeOrigin(value);
    if (origin) {
      allowed.add(origin);
    }
  }

  for (const rawOrigin of (trustedOrigins ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    const origin = normalizeOrigin(rawOrigin);
    if (origin) {
      allowed.add(origin);
    }
  }

  return allowed;
}

export function resolveSafeRedirectTarget(
  input: ResolveSafeRedirectTargetInput,
): string {
  const fallbackUrl = new URL(input.fallback, input.appUrl);

  if (!input.candidate) {
    return fallbackUrl.toString();
  }

  try {
    const candidateUrl = new URL(input.candidate, input.appUrl);

    if (!["http:", "https:"].includes(candidateUrl.protocol)) {
      return fallbackUrl.toString();
    }

    const allowedOrigins = buildAllowedOrigins(input);
    if (!allowedOrigins.has(candidateUrl.origin)) {
      return fallbackUrl.toString();
    }

    return candidateUrl.toString();
  } catch {
    return fallbackUrl.toString();
  }
}
