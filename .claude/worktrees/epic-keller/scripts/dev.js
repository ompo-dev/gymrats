// Script para iniciar o Next.js com mais memória
const { spawn } = require("node:child_process");

const args = process.argv.slice(2);
const isWebpack = args.includes("--webpack");

const nextArgs = isWebpack
	? ["dev", "--webpack", ...args.filter((arg) => arg !== "--webpack")]
	: ["dev", "--turbo", ...args];

const nextProcess = spawn("npx", ["next", ...nextArgs], {
	stdio: "inherit",
	shell: true,
	env: {
		...process.env,
		NODE_OPTIONS: "--max-old-space-size=4096",
	},
});

nextProcess.on("close", (code) => {
	process.exit(code || 0);
});

nextProcess.on("error", (error) => {
	console.error("Erro ao iniciar Next.js:", error);
	process.exit(1);
});
