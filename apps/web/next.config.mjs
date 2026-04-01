function toOrigin(value) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizeUrl(value) {
  return value?.replace(/\/$/, "") || null;
}

function resolveProxyTarget() {
  const explicitProxyTarget = normalizeUrl(process.env.API_PROXY_TARGET);

  if (explicitProxyTarget) {
    return explicitProxyTarget;
  }

  const publicApiUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_URL);
  const publicApiOrigin = toOrigin(publicApiUrl);
  const appOrigin = toOrigin(
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL,
  );

  if (
    publicApiUrl &&
    publicApiOrigin &&
    appOrigin &&
    publicApiOrigin !== appOrigin
  ) {
    return publicApiUrl;
  }

  return null;
}

const cspConnectSrc = [
  "'self'",
  "wss:",
  "https:",
  toOrigin(process.env.NEXT_PUBLIC_APP_URL),
  toOrigin(process.env.NEXT_PUBLIC_API_URL),
  toOrigin(process.env.BETTER_AUTH_URL),
  toOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL),
].filter(Boolean);

if (process.env.NODE_ENV !== "production") {
  cspConnectSrc.push("ws:");
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data: https:",
  `connect-src ${[...new Set(cspConnectSrc)].join(" ")}`,
  "frame-src 'self' https:",
  "media-src 'self' https:",
].join("; ");

const customCacheHandlerPath = "./cache-handlers/redis-cache-handler.mjs";
const shouldUseCustomCacheHandler =
  process.env.NEXT_PRIVATE_USE_CUSTOM_CACHE_HANDLER === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  ...(shouldUseCustomCacheHandler
    ? {
        cacheHandler: customCacheHandlerPath,
        cacheHandlers: {
          default: customCacheHandlerPath,
          remote: customCacheHandlerPath,
        },
        cacheMaxMemorySize: 0,
      }
    : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  cacheLife: {
    default: {
      revalidate: 900,
      expire: 31536000,
    },
    seconds: {
      stale: 30,
      revalidate: 1,
      expire: 60,
    },
    minutes: {
      stale: 300,
      revalidate: 60,
      expire: 3600,
    },
    hours: {
      stale: 300,
      revalidate: 3600,
      expire: 86400,
    },
    days: {
      stale: 300,
      revalidate: 86400,
      expire: 604800,
    },
    weeks: {
      stale: 300,
      revalidate: 604800,
      expire: 2592000,
    },
    max: {
      stale: 300,
      revalidate: 2592000,
      expire: 31536000,
    },
  },
  experimental: {
    externalDir: true,
    optimizePackageImports: [
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "lucide-react",
      "date-fns",
    ],
  },
  async rewrites() {
    const proxyTarget = resolveProxyTarget();

    if (!proxyTarget) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${proxyTarget}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/student/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/gym/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/personal/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
