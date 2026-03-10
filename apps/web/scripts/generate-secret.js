const crypto = require("node:crypto");

const secret = crypto.randomBytes(32).toString("base64");

console.log("\n🔐 BETTER_AUTH_SECRET gerado:");
console.log("=".repeat(60));
console.log(secret);
console.log("=".repeat(60));
console.log("\n⚠️  IMPORTANTE: Copie este valor para seu arquivo .env");
console.log(`   BETTER_AUTH_SECRET=${secret}`);
console.log("\n");
