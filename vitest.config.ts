import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web"),
    },
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
