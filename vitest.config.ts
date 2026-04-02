import { defineConfig } from "vitest/config";

export default defineConfig({
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
