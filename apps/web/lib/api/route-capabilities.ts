"use client";

type ClientApiCapability =
  | "studentBootstrap"
  | "gymBootstrap"
  | "personalBootstrap"
  | "observabilityEvents";

const capabilityState = new Map<ClientApiCapability, boolean>();

export function isClientApiCapabilityEnabled(capability: ClientApiCapability) {
  return capabilityState.get(capability) !== false;
}

export function disableClientApiCapability(capability: ClientApiCapability) {
  capabilityState.set(capability, false);
}

export function isRouteNotFoundError(
  error: unknown,
  expectedPath: string,
): boolean {
  const candidate = error as {
    response?: { status?: number };
    config?: { url?: string };
  };

  return (
    candidate?.response?.status === 404 &&
    typeof candidate?.config?.url === "string" &&
    candidate.config.url.includes(expectedPath)
  );
}
