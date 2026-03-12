import { getRequestContext } from "./request-runtime";
import type {
  BootstrapMeta,
  BootstrapResponse,
  BootstrapSectionTimings,
} from "@gymrats/types/bootstrap";

export async function measureBootstrapSection<T>(
  section: string,
  timings: BootstrapSectionTimings,
  loader: () => Promise<T>,
) {
  const startedAt = Date.now();
  const result = await loader();
  timings[section] = Date.now() - startedAt;
  return result;
}

export function createBootstrapMeta(options: {
  cache?: BootstrapMeta["cache"];
  sectionTimings: BootstrapSectionTimings;
  version?: string;
}): BootstrapMeta {
  const requestContext = getRequestContext();

  return {
    version: options.version ?? "2026-03-bootstrap-v1",
    generatedAt: new Date().toISOString(),
    requestId: requestContext?.requestId ?? "unknown",
    sectionTimings: options.sectionTimings,
    cache:
      options.cache ?? {
        hit: false,
        strategy: "none",
      },
  };
}

export function createBootstrapResponse<TData>(options: {
  data: TData;
  cache?: BootstrapMeta["cache"];
  sectionTimings: BootstrapSectionTimings;
  version?: string;
}): BootstrapResponse<TData> {
  return {
    data: options.data,
    meta: createBootstrapMeta({
      cache: options.cache,
      sectionTimings: options.sectionTimings,
      version: options.version,
    }),
  };
}
