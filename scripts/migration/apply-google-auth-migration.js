/**
 * Script para migrar autenticação de email/senha para apenas Google OAuth
 * Execute: node scripts/migration/apply-google-auth-migration.js
 *
 * Esta migration:
 * 1. Torna a coluna password opcional (nullable) para suportar usuários Google
 * 2. Garante que usuários existentes continuem funcionando
 * 3. Prepara o sistema para usar apenas Google OAuth via Better Auth
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("📦 Aplicando migration de autenticação Google OAuth...\n");

    const commands = [
      // 1. Tornar coluna password opcional (nullable)
      // Isso permite que usuários Google não precisem ter senha
      `ALTER TABLE "users" 
       ALTER COLUMN "password" DROP NOT NULL`,

      // 1.5. Converter emailVerified de DateTime para Boolean
      // Better Auth usa boolean, não DateTime
      // Primeiro, criar uma coluna temporária
      `ALTER TABLE "users" 
       ADD COLUMN IF NOT EXISTS "emailVerified_temp" BOOLEAN DEFAULT false`,

      // Converter valores existentes: se emailVerified não é null, significa que foi verificado
      `UPDATE "users" 
       SET "emailVerified_temp" = CASE 
         WHEN "emailVerified" IS NOT NULL THEN true 
         ELSE false 
       END`,

      // Remover coluna antiga e renomear a nova
      `ALTER TABLE "users" 
       DROP COLUMN IF EXISTS "emailVerified"`,

      `ALTER TABLE "users" 
       RENAME COLUMN "emailVerified_temp" TO "emailVerified"`,

      // 2. Criar tabela verification para Better Auth
      `CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // 3. Criar índice no identifier para melhor performance
      `CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier")`,

      // 4. Criar índice no expiresAt para limpeza automática
      `CREATE INDEX IF NOT EXISTS "verification_expiresAt_idx" ON "verification"("expiresAt")`,

      // 5. Adicionar campos createdAt e updatedAt na tabela accounts se não existirem
      `ALTER TABLE "accounts" 
       ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,

      // 6. Tornar type, provider e providerAccountId opcionais (nullable) para compatibilidade com Better Auth
      `ALTER TABLE "accounts" 
       ALTER COLUMN "type" DROP NOT NULL,
       ALTER COLUMN "provider" DROP NOT NULL,
       ALTER COLUMN "providerAccountId" DROP NOT NULL`,

      // 7. Adicionar campos Better Auth na tabela accounts
      `ALTER TABLE "accounts" 
       ADD COLUMN IF NOT EXISTS "accountId" TEXT,
       ADD COLUMN IF NOT EXISTS "providerId" TEXT,
       ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
       ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
       ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP,
       ADD COLUMN IF NOT EXISTS "idToken" TEXT`,

      // 8. Popular campos Better Auth a partir dos campos existentes
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

      // 9. Criar índices para melhor performance
      `CREATE INDEX IF NOT EXISTS "accounts_accountId_idx" ON "accounts"("accountId")`,
      `CREATE INDEX IF NOT EXISTS "accounts_providerId_idx" ON "accounts"("providerId")`,

      // 10. Atualizar tabela sessions para Better Auth
      // Adicionar campos novos
      `ALTER TABLE "sessions" 
       ADD COLUMN IF NOT EXISTS "token" TEXT,
       ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP,
       ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
       ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
       ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,

      // Popular campos novos a partir dos campos legacy
      `UPDATE "sessions" 
       SET 
         "token" = "sessionToken",
         "expiresAt" = "expires",
         "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
         "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
       WHERE "token" IS NULL`,

      // Tornar token e expiresAt obrigatórios após popular
      `ALTER TABLE "sessions" 
       ALTER COLUMN "token" SET NOT NULL,
       ALTER COLUMN "expiresAt" SET NOT NULL`,

      // Tornar sessionToken e expires opcionais (mantidos para compatibilidade)
      `ALTER TABLE "sessions" 
       ALTER COLUMN "sessionToken" DROP NOT NULL,
       ALTER COLUMN "expires" DROP NOT NULL`,

      // Criar índice único no token se não existir
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
          // Se a coluna já é nullable, ignorar
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

    // Verificar estatísticas dos usuários
    console.log("\n📊 Verificando estatísticas dos usuários...\n");

    const totalUsers = await prisma.user.count();

    // Usar SQL raw para contar usuários com senha (não null)
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

    // Verificar se tabela verification foi criada
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
