export type BootstrapSectionTimings = Record<string, number>;

export interface BootstrapCacheMeta {
  hit: boolean;
  strategy: string;
  ttlMs?: number;
}

export interface BootstrapMeta {
  version: string;
  generatedAt: string;
  requestId: string;
  sectionTimings: BootstrapSectionTimings;
  cache: BootstrapCacheMeta;
}

export interface BootstrapResponse<TData> {
  data: TData;
  meta: BootstrapMeta;
}
