import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const biomeExecutable =
  process.platform === "win32"
    ? path.join(rootDir, "node_modules", ".bin", "biome.exe")
    : path.join(rootDir, "node_modules", ".bin", "biome");
const writeMode = process.argv.includes("--write");
const biomeArgs = writeMode ? ["check", "--write"] : ["check"];
const maxFilesPerChunk = 25;
const supportedExtensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".mjs",
  ".cjs",
]);

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function normalizeFileList(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((filePath) => supportedExtensions.has(path.extname(filePath)));
}

const trackedChangedFiles = normalizeFileList(
  runGit(["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD"]),
);
const untrackedFiles = normalizeFileList(
  runGit(["ls-files", "--others", "--exclude-standard"]),
);
const files = [...new Set([...trackedChangedFiles, ...untrackedFiles])];

if (files.length === 0) {
  console.log("[lint:changed] Nenhum arquivo alterado compativel com o Biome.");
  process.exit(0);
}

function chunkFiles(allFiles) {
  const chunks = [];
  for (let index = 0; index < allFiles.length; index += maxFilesPerChunk) {
    chunks.push(allFiles.slice(index, index + maxFilesPerChunk));
  }
  return chunks;
}

for (const chunk of chunkFiles(files)) {
  const result = spawnSync(biomeExecutable, [...biomeArgs, ...chunk], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}
