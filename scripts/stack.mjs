import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const args = process.argv.slice(2);
const positionals = args.filter((arg) => !arg.startsWith("--"));
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const command = positionals[0] ?? "help";
const service = positionals[1];

const isDev = flags.has("--dev");
const shouldBuild = flags.has("--build");
const shouldPull = flags.has("--pull");
const removeVolumes = flags.has("--volumes");
const noFollow = flags.has("--no-follow");
const useLocalDb = flags.has("--local-db");

const requestedEnvFile =
  args.find((arg) => arg.startsWith("--env-file="))?.split("=")[1] ??
  ".env.docker";
const envFileExists = existsSync(path.join(rootDir, requestedEnvFile));
const composeFile = isDev ? "docker-compose.dev.yml" : "docker-compose.yml";
const exampleEnvFile = ".env.docker.example";

function run(commandName, commandArgs, options = {}) {
  const result = spawnSync(commandName, commandArgs, {
    stdio: options.capture ? "pipe" : "inherit",
    cwd: rootDir,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 0) !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout?.trim() ?? "";
}

function composeArgs(extraArgs = [], options = {}) {
  const baseArgs = ["compose", "-f", composeFile];

  if (!envFileExists) {
    throw new Error(
      `Arquivo ${requestedEnvFile} nao encontrado. Rode "npm run stack:init" antes de usar o stack.`,
    );
  }

  baseArgs.push("--env-file", requestedEnvFile);

  if (useLocalDb) {
    baseArgs.push("--profile", "local-db");
  }

  for (const profile of options.profiles ?? []) {
    baseArgs.push("--profile", profile);
  }

  return [...baseArgs, ...extraArgs];
}

function ensureEnvFile() {
  const targetPath = path.join(rootDir, requestedEnvFile);
  const examplePath = path.join(rootDir, exampleEnvFile);

  if (existsSync(targetPath)) {
    console.log(`Arquivo ${requestedEnvFile} ja existe.`);
    return;
  }

  if (!existsSync(examplePath)) {
    throw new Error(
      `Nao encontrei ${exampleEnvFile} para inicializar o stack.`,
    );
  }

  copyFileSync(examplePath, targetPath);
  console.log(
    `Arquivo ${requestedEnvFile} criado a partir de ${exampleEnvFile}.`,
  );
}

function printHelp() {
  console.log(`GymRats Stack CLI

Uso:
  node scripts/stack.mjs <comando> [servico] [--dev] [--build] [--pull]

Comandos:
  init            cria .env.docker a partir do exemplo
  doctor          valida Docker e mostra compose/env ativos
  build [svc]     builda imagens do stack
  migrate         executa migrations via apps/web/scripts/migration
  up [svc]        sobe containers em background
  down            derruba containers
  restart [svc]   reinicia containers
  ps              mostra status dos containers
  logs [svc]      mostra logs (segue por padrao)
  monitor         mostra status e abre docker stats
  update [svc]    faz build --pull e sobe novamente
  cron            executa o job de cron uma vez
  help            mostra esta ajuda

Flags:
  --dev                 usa docker-compose.dev.yml
  --build               com up, refaz o build antes de subir
  --pull                com build/update, puxa imagens base mais recentes
  --volumes             com down, remove volumes do compose
  --no-follow           com logs, nao segue em tempo real
  --local-db            habilita o servico opcional de Postgres local
  --env-file=<arquivo>  escolhe outro arquivo de ambiente
`);
}

switch (command) {
  case "init": {
    ensureEnvFile();
    break;
  }
  case "doctor": {
    console.log(`Compose file: ${composeFile}`);
    console.log(`Env file: ${requestedEnvFile}`);
    console.log(`Env status: ${envFileExists ? "ok" : "ausente"}`);
    console.log(`Local DB profile: ${useLocalDb ? "ativo" : "desligado"}`);
    run("docker", ["--version"]);
    run("docker", ["compose", "version"]);
    break;
  }
  case "build": {
    const extraArgs = ["build"];
    if (shouldPull) extraArgs.push("--pull");
    if (service) extraArgs.push(service);
    run("docker", composeArgs(extraArgs));
    break;
  }
  case "migrate": {
    run(
      "docker",
      composeArgs(["run", "--rm", "--build", "migrate"], { profiles: ["ops"] }),
    );
    break;
  }
  case "up": {
    const extraArgs = ["up", "-d"];
    if (shouldBuild) extraArgs.push("--build");
    if (service) extraArgs.push(service);
    run("docker", composeArgs(extraArgs));
    break;
  }
  case "down": {
    const extraArgs = ["down", "--remove-orphans"];
    if (removeVolumes) extraArgs.push("--volumes");
    run("docker", composeArgs(extraArgs));
    break;
  }
  case "restart": {
    const extraArgs = ["restart"];
    if (service) extraArgs.push(service);
    run("docker", composeArgs(extraArgs));
    break;
  }
  case "ps":
  case "status": {
    run("docker", composeArgs(["ps"]));
    break;
  }
  case "logs": {
    const extraArgs = ["logs"];
    if (!noFollow) extraArgs.push("-f");
    if (service) extraArgs.push(service);
    run("docker", composeArgs(extraArgs));
    break;
  }
  case "monitor": {
    run("docker", composeArgs(["ps"]));
    const idsOutput = run("docker", composeArgs(["ps", "-q"]), {
      capture: true,
    });
    const ids = idsOutput.split(/\r?\n/).filter(Boolean);

    if (ids.length === 0) {
      console.log("Nenhum container em execucao para monitorar.");
      break;
    }

    run("docker", ["stats", ...ids]);
    break;
  }
  case "update": {
    const buildArgs = ["build", "--pull"];
    const upArgs = ["up", "-d", "--build"];
    if (service) {
      buildArgs.push(service);
      upArgs.push(service);
    }
    run("docker", composeArgs(buildArgs));
    run("docker", composeArgs(upArgs));
    break;
  }
  case "cron": {
    run("docker", composeArgs(["run", "--rm", "cron"], { profiles: ["jobs"] }));
    break;
  }
  default: {
    printHelp();
    if (command !== "help") {
      process.exitCode = 1;
    }
  }
}
