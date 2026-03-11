import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Elysia } from "elysia";
import { runWithRequestContext } from "../lib/runtime/request-context";
import { createNextRequest } from "../runtime/next-server";

type RouteSegment =
  | { type: "static"; value: string }
  | { type: "dynamic"; name: string }
  | { type: "catchall"; name: string };

type RouteManifestEntry = {
  filePath: string;
  routePath: string;
  elysiaPath: string;
  segments: RouteSegment[];
  rank: [number, number, number, number];
};

type RouteModuleOptions = {
  exclude?: string[];
};

function resolveRouteModulesRoot() {
  const candidates = [
    path.resolve(process.cwd(), "src", "routes"),
    path.resolve(process.cwd(), "apps", "api", "src", "routes"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Nao foi possivel localizar os modulos HTTP em apps/api/src/routes.",
  );
}

const routeModulesRoot = resolveRouteModulesRoot();
const routeModuleCache = new Map<string, Promise<Record<string, unknown>>>();

function walkRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return walkRouteFiles(fullPath);
    }

    if (entry.isFile() && entry.name === "route.ts") {
      return [fullPath];
    }

    return [];
  });
}

function toRouteSegments(relativeFilePath: string): RouteSegment[] {
  const withoutFileName = relativeFilePath
    .replace(/\\/g, "/")
    .replace(/\/route\.ts$/, "");

  if (!withoutFileName) {
    return [];
  }

  return withoutFileName.split("/").map((segment) => {
    if (/^\[\.\.\..+\]$/.test(segment)) {
      return {
        type: "catchall",
        name: segment.slice(4, -1),
      } as const;
    }

    if (/^\[[^\]]+\]$/.test(segment)) {
      return {
        type: "dynamic",
        name: segment.slice(1, -1),
      } as const;
    }

    return {
      type: "static",
      value: segment,
    } as const;
  });
}

function toRoutePath(segments: RouteSegment[]) {
  if (!segments.length) {
    return "/api";
  }

  return (
    "/api/" +
    segments
      .map((segment) =>
        segment.type === "static"
          ? segment.value
          : segment.type === "dynamic"
            ? `[${segment.name}]`
            : `[...${segment.name}]`,
      )
      .join("/")
  );
}

function toElysiaPath(segments: RouteSegment[]) {
  if (!segments.length) {
    return "/api";
  }

  return (
    "/api/" +
    segments
      .map((segment) =>
        segment.type === "static"
          ? segment.value
          : segment.type === "dynamic"
            ? `:${segment.name}`
            : "*",
      )
      .join("/")
  );
}

function rankSegments(segments: RouteSegment[]): [number, number, number, number] {
  const staticCount = segments.filter((segment) => segment.type === "static").length;
  const dynamicCount = segments.filter((segment) => segment.type === "dynamic").length;
  const catchallCount = segments.filter((segment) => segment.type === "catchall").length;

  return [staticCount, segments.length, -dynamicCount, -catchallCount];
}

function compareRanks(
  left: [number, number, number, number],
  right: [number, number, number, number],
) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return right[index] - left[index];
    }
  }

  return 0;
}

const routeManifest: RouteManifestEntry[] = walkRouteFiles(routeModulesRoot)
  .map((filePath) => {
    const relativeFilePath = path.relative(routeModulesRoot, filePath);
    const segments = toRouteSegments(relativeFilePath);

    return {
      filePath,
      routePath: toRoutePath(segments),
      elysiaPath: toElysiaPath(segments),
      segments,
      rank: rankSegments(segments),
    };
  })
  .sort((left, right) => compareRanks(left.rank, right.rank));

function matchRoute(
  entry: RouteManifestEntry,
  pathname: string,
): Record<string, string | string[]> | null {
  const requestSegments = pathname
    .replace(/^\/api\/?/, "")
    .split("/")
    .filter(Boolean);

  const params: Record<string, string | string[]> = {};
  let requestIndex = 0;

  for (let entryIndex = 0; entryIndex < entry.segments.length; entryIndex += 1) {
    const segment = entry.segments[entryIndex];

    if (segment.type === "catchall") {
      params[segment.name] = requestSegments.slice(requestIndex);
      return params;
    }

    const requestSegment = requestSegments[requestIndex];

    if (!requestSegment) {
      return null;
    }

    if (segment.type === "static") {
      if (segment.value !== requestSegment) {
        return null;
      }
    } else {
      params[segment.name] = requestSegment;
    }

    requestIndex += 1;
  }

  return requestIndex === requestSegments.length ? params : null;
}

async function loadRouteModule(entry: RouteManifestEntry) {
  let cachedModule = routeModuleCache.get(entry.filePath);

  if (!cachedModule) {
    cachedModule = import(pathToFileURL(entry.filePath).href);
    routeModuleCache.set(entry.filePath, cachedModule);
  }

  return cachedModule;
}

function toResponse(result: unknown): Response {
  if (result instanceof Response) {
    return result;
  }

  if (result == null) {
    return new Response(null, { status: 204 });
  }

  if (typeof result === "object") {
    return Response.json(result);
  }

  return new Response(String(result));
}

async function executeRouteModule(
  entry: RouteManifestEntry,
  request: Request,
): Promise<Response> {
  const { pathname } = new URL(request.url);
  const params = matchRoute(entry, pathname);

  if (!params) {
    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const routeModule = await loadRouteModule(entry);
  const method = request.method.toUpperCase();
  const handler = routeModule[method];

  if (typeof handler !== "function") {
    const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
      .filter((candidate) => typeof routeModule[candidate] === "function")
      .join(", ");

    return new Response(
      JSON.stringify({ error: `Method ${method} not allowed for ${pathname}` }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...(allowedMethods ? { Allow: allowedMethods } : {}),
        },
      },
    );
  }

  const nextRequest = await createNextRequest(request);
  const result = await runWithRequestContext(nextRequest.headers, () =>
    handler(nextRequest, {
      params: Promise.resolve(params),
    }),
  );

  return toResponse(result);
}

function filterRouteManifest(exclude: Set<string>) {
  return routeManifest.filter((entry) => !exclude.has(entry.routePath));
}

export function createRouteModulesPlugin(options: RouteModuleOptions = {}) {
  const exclude = new Set(options.exclude ?? []);
  let plugin = new Elysia();

  for (const entry of filterRouteManifest(exclude)) {
    plugin = plugin.all(
      entry.elysiaPath,
      ({ request }) => executeRouteModule(entry, request),
      { parse: "none" },
    );
  }

  return plugin;
}

export function getRouteModuleCount(options: RouteModuleOptions = {}) {
  return filterRouteManifest(new Set(options.exclude ?? [])).length;
}
