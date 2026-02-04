#!/usr/bin/env node

/**
 * Script para sincronizar a versão do app em todos os arquivos
 * A fonte única da verdade é o package.json
 *
 * Uso: node scripts/sync-version.js
 * Ou: npm run version:sync
 */

const fs = require("node:fs");
const path = require("node:path");

// Lê a versão do package.json
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const appVersion = packageJson.version;

if (!appVersion) {
	console.error("❌ Erro: Versão não encontrada no package.json");
	process.exit(1);
}

console.log(`🔄 Sincronizando versão: ${appVersion}`);

// Converte a versão para o formato de cache (v1.0.0 -> v1.0.0)
const cacheVersion = `v${appVersion}`;

// 1. Atualiza lib/constants/version.ts
const versionTsPath = path.join(
	__dirname,
	"..",
	"lib",
	"constants",
	"version.ts",
);
const versionTsContent = `// Versão da aplicação e do cache PWA
// IMPORTANTE: Este arquivo é atualizado automaticamente pelo script sync-version.js
// Para alterar a versão, edite apenas o package.json e execute: npm run version:sync
export const APP_VERSION = "${appVersion}";
export const CACHE_VERSION = "${cacheVersion}";
`;

fs.writeFileSync(versionTsPath, versionTsContent, "utf8");
console.log(`✅ Atualizado: lib/constants/version.ts`);

// 2. Atualiza public/sw.js
const swJsPath = path.join(__dirname, "..", "public", "sw.js");
let swJsContent = fs.readFileSync(swJsPath, "utf8");

// Substitui a linha do CACHE_VERSION (suporta qualquer versão anterior)
swJsContent = swJsContent.replace(
	/const CACHE_VERSION = "v[^"]+";/,
	`const CACHE_VERSION = "${cacheVersion}";`,
);

// Atualiza o comentário também (suporta ambos os formatos)
swJsContent = swJsContent.replace(
	/\/\/ IMPORTANTE: (Alterar a versão do cache quando houver atualizações significativas|Esta versão é atualizada automaticamente pelo script sync-version\.js)\n\/\/ (Esta versão deve ser mantida sincronizada com lib\/constants\/version\.ts|Para alterar, edite apenas o package\.json e execute: npm run version:sync)/,
	`// IMPORTANTE: Esta versão é atualizada automaticamente pelo script sync-version.js\n// Para alterar, edite apenas o package.json e execute: npm run version:sync`,
);

fs.writeFileSync(swJsPath, swJsContent, "utf8");
console.log(`✅ Atualizado: public/sw.js`);

console.log(`\n✨ Versão sincronizada com sucesso!`);
console.log(`📦 Versão do app: ${appVersion}`);
console.log(`💾 Versão do cache: ${cacheVersion}`);
