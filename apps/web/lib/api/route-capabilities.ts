"use client";

type ClientApiCapability =
  | "studentBootstrap"
  | "gymBootstrap"
  | "personalBootstrap"
  | "observabilityEvents";

const capabilityState = new Map<ClientApiCapability, boolean>();
const CAPABILITY_STORAGE_KEY = "gymrats.client-api-capabilities";
let didHydrateCapabilityState = false;

function getCapabilityStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function hydrateCapabilityState() {
  if (didHydrateCapabilityState) {
    return;
  }

  didHydrateCapabilityState = true;
  const storage = getCapabilityStorage();
  const rawValue = storage?.getItem(CAPABILITY_STORAGE_KEY);

  if (!rawValue) {
    return;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<
      Record<ClientApiCapability, boolean>
    >;

    for (const [capability, enabled] of Object.entries(parsed)) {
      if (enabled === false) {
        capabilityState.set(capability as ClientApiCapability, false);
      }
    }
  } catch {
    storage?.removeItem(CAPABILITY_STORAGE_KEY);
  }
}

function persistCapabilityState() {
  const storage = getCapabilityStorage();
  if (!storage) {
    return;
  }

  storage.setItem(
    CAPABILITY_STORAGE_KEY,
    JSON.stringify(Object.fromEntries(capabilityState.entries())),
  );
}

export function isClientApiCapabilityEnabled(capability: ClientApiCapability) {
  hydrateCapabilityState();
  return capabilityState.get(capability) !== false;
}

export function disableClientApiCapability(capability: ClientApiCapability) {
  hydrateCapabilityState();
  capabilityState.set(capability, false);
  persistCapabilityState();
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
