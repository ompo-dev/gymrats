/**
 * Gera openapi.json a partir do swagger-spec para uso pelo Orval.
 * Executar: bun run scripts/generate-openapi.ts
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSwaggerSpec } from "@gymrats/api/swagger-spec";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:4000";
const spec = getSwaggerSpec(baseUrl);
const outputPath = resolve(process.cwd(), "openapi.json");

writeFileSync(outputPath, JSON.stringify(spec, null, 2), "utf-8");
console.log(`[generate-openapi] openapi.json gerado em ${outputPath}`);
