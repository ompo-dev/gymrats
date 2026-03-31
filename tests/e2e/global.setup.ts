import { mkdir } from "node:fs/promises";
import path from "node:path";

export default async function globalSetup() {
  await mkdir(path.resolve(process.cwd(), "tests/e2e/.auth"), {
    recursive: true,
  });
}
