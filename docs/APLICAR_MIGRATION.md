# 🚀 Como Aplicar a Migration de Assinaturas

O Prisma pode estar travando ao tentar aplicar migrations. Use uma das opções abaixo:

## Opção 1: Script Node.js (Recomendado)

```bash
node scripts/apply-subscriptions-migration.js
npx prisma generate
```

## Opção 2: SQL Direto no Banco

1. Abra seu cliente PostgreSQL (pgAdmin, DBeaver, etc.)
2. Conecte ao banco
3. Execute o arquivo: `prisma/migrations/manual_add_subscriptions.sql`
4. Depois execute: `npx prisma generate`

## Opção 3: Via Prisma Studio (Se funcionar)

```bash
npx prisma studio
```

E crie as tabelas manualmente através da interface.

## Opção 4: Forçar Prisma DB Push

Se o Prisma estiver travando, tente com timeout maior:

```bash
# Windows PowerShell
$env:PRISMA_CLI_QUERY_ENGINE_TYPE="binary"; npx prisma db push --skip-generate

# Depois
npx prisma generate
```

## Verificar se Funcionou

```bash
npx prisma studio
```

Você deve ver as novas tabelas:
- `subscriptions`
- `gym_subscriptions`
- `subscription_features`
- `subscription_payments`

