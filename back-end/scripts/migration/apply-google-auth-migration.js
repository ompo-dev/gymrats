const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de autenticação Google OAuth...\n");

    const commands = [
      `ALTER TABLE "users" 
       ALTER COLUMN "password" DROP NOT NULL`,
      `ALTER TABLE "users" 
       ADD COLUMN IF NOT EXISTS "emailVerified_temp" BOOLEAN DEFAULT false`,
      `UPDATE "users" 
       SET "emailVerified_temp" = CASE 
         WHEN "emailVerified" IS NOT NULL THEN true 
         ELSE false 
       END`,
      `ALTER TABLE "users" 
       DROP COLUMN IF EXISTS "emailVerified"`,
      `ALTER TABLE "users" 
       RENAME COLUMN "emailVerified_temp" TO "emailVerified"`,
      `CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier")`,
      `CREATE INDEX IF NOT EXISTS "verification_expiresAt_idx" ON "verification"("expiresAt")`,
      `ALTER TABLE "accounts" 
       ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE "accounts" 
       ALTER COLUMN "type" DROP NOT NULL,
       ALTER COLUMN "provider" DROP NOT NULL,
       ALTER COLUMN "providerAccountId" DROP NOT NULL`,
      `ALTER TABLE "accounts" 
       ADD COLUMN IF NOT EXISTS "accountId" TEXT,
       ADD COLUMN IF NOT EXISTS "providerId" TEXT,
       ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
       ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
       ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP,
       ADD COLUMN IF NOT EXISTS "idToken" TEXT`,
      `UPDATE "accounts" 
       SET 
         "accountId" = "providerAccountId",
         "providerId" = "provider",
         "accessToken" = "access_token",
         "refreshToken" = "refresh_token",
         "idToken" = "id_token",
         "accessTokenExpiresAt" = CASE 
           WHEN "expires_at" IS NOT NULL 
           THEN to_timestamp("expires_at")
           ELSE NULL
         END
       WHERE "accountId" IS NULL`,
      `CREATE INDEX IF NOT EXISTS "accounts_accountId_idx" ON "accounts"("accountId")`,
      `CREATE INDEX IF NOT EXISTS "accounts_providerId_idx" ON "accounts"("providerId")`,
      `ALTER TABLE "sessions" 
       ADD COLUMN IF NOT EXISTS "token" TEXT,
       ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP,
       ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
       ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
       ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      `UPDATE "sessions" 
       SET 
         "token" = "sessionToken",
         "expiresAt" = "expires",
         "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
         "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
       WHERE "token" IS NULL`,
      `ALTER TABLE "sessions" 
       ALTER COLUMN "token" SET NOT NULL,
       ALTER COLUMN "expiresAt" SET NOT NULL`,
      `ALTER TABLE "sessions" 
       ALTER COLUMN "sessionToken" DROP NOT NULL,
       ALTER COLUMN "expires" DROP NOT NULL`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token")`,
    ];

    console.log(`Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      try {
        await prisma.$executeRawUnsafe(commands[i]);
        console.log(
          `✅ Comando ${i + 1}/${commands.length} executado com sucesso`
        );
      } catch (error) {
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("does not exist") ||
          (error.message.includes("column") &&
            (error.message.includes("already exists") ||
              error.message.includes("does not exist")))
        ) {
          console.log(
            `⚠️  Comando ${i + 1}/${
              commands.length
            } ignorado (já existe ou não necessário)`
          );
        } else if (error.message.includes("DROP NOT NULL")) {
          console.log(
            `⚠️  Comando ${i + 1}/${
              commands.length
            } ignorado (coluna já é nullable)`
          );
        } else {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n📊 Verificando estatísticas dos usuários...\n");

    const totalUsers = await prisma.user.count();

    const usersWithPasswordResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count 
      FROM users 
      WHERE password IS NOT NULL
    `;
    const usersWithPassword = usersWithPasswordResult[0]?.count || 0;

    const usersWithGoogle = await prisma.account.count({
      where: {
        provider: "google",
      },
    });

    const verificationTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification'
      ) as exists
    `;
    const hasVerificationTable = verificationTableExists[0]?.exists || false;

    console.log(`   Total de usuários: ${totalUsers}`);
    console.log(`   Usuários com senha: ${usersWithPassword}`);
    console.log(`   Contas Google linkadas: ${usersWithGoogle}`);
    console.log(
      `   Tabela verification criada: ${hasVerificationTable ? "✅" : "❌"}`
    );

    console.log("\n✅ Migration aplicada com sucesso!");
    console.log("📝 Execute: npx prisma generate");
    console.log("\n📋 Resumo das mudanças:");
    console.log("   - Coluna password agora é opcional (nullable)");
    console.log("   - Tabela verification criada para Better Auth");
    console.log("   - Usuários existentes continuam funcionando normalmente");
    console.log(
      "   - Usuários podem fazer login apenas com Google OAuth usando o mesmo email"
    );
    console.log(
      "   - Ao fazer logout, precisarão fazer login novamente pelo Google"
    );
    console.log(
      "   - Sistema migrado para usar apenas Better Auth com Google OAuth"
    );
  } catch (error) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
