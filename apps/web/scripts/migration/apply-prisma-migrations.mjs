import {
  getMigrationEnv,
  loadEnvFile,
  parseArgs,
  printMigrationContext,
  runPrisma,
} from "./lib.mjs";
import { runPrismaMigrationSafetyCheck } from "./prisma-migration-safety.mjs";

const { flags } = parseArgs();
const envFile = flags.get("env-file");

if (envFile) {
  loadEnvFile(envFile);
}

const safetyResult = await runPrismaMigrationSafetyCheck({
  requireDbState: false,
});
if (!safetyResult.ok) {
  throw new Error(
    "Prisma migration chain inconsistente. Corrija a estrategia de migration antes de aplicar deploy do Prisma.",
  );
}

printMigrationContext();
runPrisma(["migrate", "deploy"], getMigrationEnv());
