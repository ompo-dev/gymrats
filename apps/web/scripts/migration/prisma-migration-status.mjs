import {
  getMigrationEnv,
  loadEnvFile,
  parseArgs,
  printMigrationContext,
  runPrisma,
} from "./lib.mjs";

const { flags } = parseArgs();
const envFile = flags.get("env-file");

if (envFile) {
  loadEnvFile(envFile);
}

printMigrationContext();
runPrisma(["migrate", "status"], getMigrationEnv());
