export type CacheScope = "private" | "remote" | "default" | "none";

export type CacheProfile =
  | "default"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "max";

export type SerializableQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type CacheMetadata = {
  area: string;
  resource: string;
  profile: CacheProfile;
  scope: CacheScope;
  directTags: string[];
  derivedTags: string[];
  tags: string[];
};

export type RouteContext = {
  path: string;
  pathname: string;
  segments: string[];
  query: Record<string, string>;
};

export const EMPTY_METADATA: CacheMetadata = {
  area: "unknown",
  resource: "unknown",
  profile: "minutes",
  scope: "private",
  directTags: [],
  derivedTags: [],
  tags: [],
};
