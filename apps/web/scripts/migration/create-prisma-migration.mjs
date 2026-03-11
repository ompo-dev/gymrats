import {
  getMigrationEnv,
  loadEnvFile,
  parseArgs,
  printMigrationContext,
  runPrisma,
} from "./lib.mjs";

const { flags, positionals } = parseArgs();
const envFile = flags.get("env-file");
const migrationName = flags.get("name") ?? positionals[0];

if (!migrationName) {
  throw new Error(
    "Informe o nome da migration. Exemplo: node apps/web/scripts/migration/create-prisma-migration.mjs add_new_table --env-file=.env.docker",
  );
}

if (envFile) {
  loadEnvFile(envFile);
}

printMigrationContext();
runPrisma(
  ["migrate", "dev", "--create-only", "--name", migrationName],
  getMigrationEnv(),
);
