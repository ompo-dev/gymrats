export type ResourceStatus = "idle" | "loading" | "ready" | "error";

export interface ResourceState {
  status: ResourceStatus;
  lastStartedAt: Date | null;
  lastFetchedAt: Date | null;
  error: string | null;
}

export type ResourceStateMap<Section extends string> = Record<
  Section,
  ResourceState
>;

const createResourceState = (): ResourceState => ({
  status: "idle",
  lastStartedAt: null,
  lastFetchedAt: null,
  error: null,
});

export function createResourceStateMap<Section extends string>(
  sections: readonly Section[],
): ResourceStateMap<Section> {
  return sections.reduce(
    (acc, section) => {
      acc[section] = createResourceState();
      return acc;
    },
    {} as ResourceStateMap<Section>,
  );
}

export function markResourcesLoading<Section extends string>(
  stateMap: ResourceStateMap<Section>,
  sections: readonly Section[],
): ResourceStateMap<Section> {
  const startedAt = new Date();
  const next = { ...stateMap };
  sections.forEach((section) => {
    next[section] = {
      ...next[section],
      status: "loading",
      lastStartedAt: startedAt,
      error: null,
    };
  });
  return next;
}

export function markResourcesReady<Section extends string>(
  stateMap: ResourceStateMap<Section>,
  sections: readonly Section[],
): ResourceStateMap<Section> {
  const fetchedAt = new Date();
  const next = { ...stateMap };
  sections.forEach((section) => {
    next[section] = {
      ...next[section],
      status: "ready",
      lastFetchedAt: fetchedAt,
      error: null,
    };
  });
  return next;
}

export function markResourceError<Section extends string>(
  stateMap: ResourceStateMap<Section>,
  section: Section,
  error: string,
): ResourceStateMap<Section> {
  return {
    ...stateMap,
    [section]: {
      ...stateMap[section],
      status: "error",
      error,
    },
  };
}

export function shouldReloadResource(
  resource: ResourceState | undefined,
  freshnessMs: number,
  force = false,
): boolean {
  if (force) return true;
  if (!resource) return true;
  if (resource.status === "idle" || resource.status === "error") return true;
  if (!resource.lastFetchedAt) return true;
  return Date.now() - new Date(resource.lastFetchedAt).getTime() >= freshnessMs;
}

export function pickSectionsToReload<Section extends string>(
  stateMap: ResourceStateMap<Section>,
  sections: readonly Section[],
  freshnessMs: number,
  force = false,
): Section[] {
  return sections.filter((section) =>
    shouldReloadResource(stateMap[section], freshnessMs, force),
  );
}
