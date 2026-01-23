#!/usr/bin/env node

/**
 * Script para gerar ícones PNG a partir do icon.svg
 * Requer: npm install sharp --save-dev
 */

const fs = require("fs");
const path = require("path");

// Verifica se sharp está instalado
let sharp;
try {
  sharp = require("sharp");
} catch (error) {
  console.error("❌ Erro: sharp não está instalado.");
  console.log("📦 Execute: npm install sharp --save-dev");
  process.exit(1);
}

const publicDir = path.join(__dirname, "..", "public");
const iconSvg = path.join(publicDir, "icon.svg");

// Verifica se o SVG existe
if (!fs.existsSync(iconSvg)) {
  console.error(`❌ Arquivo não encontrado: ${iconSvg}`);
  process.exit(1);
}

const icons = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-icon.png" },
  { size: 180, name: "apple-icon-180.png" }, // Para compatibilidade iOS
];

async function generateIcons() {
  console.log("🎨 Gerando ícones a partir de icon.svg...\n");

  for (const icon of icons) {
    try {
      await sharp(iconSvg)
        .resize(icon.size, icon.size, {
          fit: "contain",
          background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0F172A
        })
        .png()
        .toFile(path.join(publicDir, icon.name));

      console.log(
        `✅ ${icon.name} (${icon.size}x${icon.size}) gerado com sucesso!`
      );
    } catch (error) {
      console.error(`❌ Erro ao gerar ${icon.name}:`, error.message);
    }
  }

  console.log("\n✨ Todos os ícones foram gerados!");
  console.log("📱 Os arquivos estão em: public/");
}

generateIcons().catch(console.error);
