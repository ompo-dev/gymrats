import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@/lib/api/middleware/auth.middleware",
        replacement: path.resolve(
          __dirname,
          "apps/api/src/lib/api/middleware/auth.middleware.ts",
        ),
      },
      {
        find: "@/lib/api/utils/response.utils",
        replacement: path.resolve(
          __dirname,
          "apps/api/src/lib/api/utils/response.utils.ts",
        ),
      },
      {
        find: "@/lib/api/utils/response",
        replacement: path.resolve(
          __dirname,
          "apps/api/src/server/utils/response.ts",
        ),
      },
      {
        find: "@/lib/api/schemas",
        replacement: path.resolve(__dirname, "apps/api/src/lib/api/schemas"),
      },
      {
        find: "@/lib/db",
        replacement: path.resolve(__dirname, "apps/api/src/lib/db.ts"),
      },
      {
        find: "@/lib/utils/json",
        replacement: path.resolve(__dirname, "apps/api/src/lib/utils/json.ts"),
      },
      {
        find: "@/lib/observability",
        replacement: path.resolve(__dirname, "apps/api/src/lib/observability"),
      },
      {
        find: "@/lib/security/audit-log",
        replacement: path.resolve(
          __dirname,
          "apps/api/src/lib/security/audit-log.ts",
        ),
      },
      {
        find: "@/lib/runtime/request-context",
        replacement: path.resolve(
          __dirname,
          "apps/api/src/lib/runtime/request-context.ts",
        ),
      },
      {
        find: "@/lib/use-cases/auth",
        replacement: path.resolve(__dirname, "apps/api/src/lib/use-cases/auth"),
      },
      {
        find: "@/runtime/next-server",
        replacement: path.resolve(__dirname, "apps/api/src/runtime/next-server.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "apps/web"),
      },
    ],
  },
  test: {
    environment: "node",
    include: [
      "packages/domain/src/**/*.test.ts",
      "apps/api/src/**/*.test.ts",
      "apps/web/lib/**/*.test.ts",
    ],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
