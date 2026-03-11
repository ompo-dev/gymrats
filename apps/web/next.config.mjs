function toOrigin(value) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
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

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Rewrites removidos - o custom-server.ts já roteia /api/* para o Elysia
  // async rewrites() {
  //   const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: `${apiBase}/api/:path*`,
  //     },
  //   ];
  // },
  async headers() {
    return [
      {
        source: "/student/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
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
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
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
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
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
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/image/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
