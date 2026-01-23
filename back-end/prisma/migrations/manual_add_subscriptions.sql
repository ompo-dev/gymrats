-- ============================================
-- MIGRATION MANUAL: Adicionar Tabelas de Assinatura
-- Execute este script diretamente no seu banco PostgreSQL
-- ============================================

-- Criar tabela de assinaturas de alunos
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL UNIQUE,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP NOT NULL,
    "currentPeriodEnd" TIMESTAMP NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP,
    "trialStart" TIMESTAMP,
    "trialEnd" TIMESTAMP,
    "abacatePayBillingId" TEXT UNIQUE,
    "abacatePayCustomerId" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar tabela de assinaturas de academias
CREATE TABLE IF NOT EXISTS "gym_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL UNIQUE,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "basePrice" DOUBLE PRECISION NOT NULL,
    "pricePerStudent" DOUBLE PRECISION NOT NULL,
    "currentPeriodStart" TIMESTAMP NOT NULL,
    "currentPeriodEnd" TIMESTAMP NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP,
    "trialStart" TIMESTAMP,
    "trialEnd" TIMESTAMP,
    "abacatePayBillingId" TEXT UNIQUE,
    "abacatePayCustomerId" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gym_subscriptions_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar tabela de features premium
CREATE TABLE IF NOT EXISTS "subscription_features" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "featureKey" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de pagamentos de assinaturas
CREATE TABLE IF NOT EXISTS "subscription_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT,
    "gymSubscriptionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "abacatePayBillingId" TEXT UNIQUE,
    "paidAt" TIMESTAMP,
    "failedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "subscriptions_studentId_idx" ON "subscriptions"("studentId");
CREATE INDEX IF NOT EXISTS "subscriptions_abacatePayBillingId_idx" ON "subscriptions"("abacatePayBillingId");
CREATE INDEX IF NOT EXISTS "gym_subscriptions_gymId_idx" ON "gym_subscriptions"("gymId");
CREATE INDEX IF NOT EXISTS "gym_subscriptions_abacatePayBillingId_idx" ON "gym_subscriptions"("abacatePayBillingId");
CREATE INDEX IF NOT EXISTS "subscription_features_featureKey_idx" ON "subscription_features"("featureKey");
CREATE INDEX IF NOT EXISTS "subscription_payments_abacatePayBillingId_idx" ON "subscription_payments"("abacatePayBillingId");

-- Inserir features premium padrão
INSERT INTO "subscription_features" ("id", "featureKey", "name", "description", "category", "icon") VALUES
    ('feat_ai_workout', 'ai_workout', 'Gerador de Treinos com IA', 'Crie treinos personalizados usando inteligência artificial', 'ai', 'sparkles'),
    ('feat_ai_diet', 'ai_diet', 'Gerador de Dietas com IA', 'Crie planos alimentares personalizados usando IA', 'ai', 'utensils'),
    ('feat_posture_analysis', 'posture_analysis', 'Análise de Postura', 'Análise avançada de forma e postura com IA', 'ai', 'scan'),
    ('feat_coach', 'coach', 'Coach Pessoal Virtual', 'Acompanhamento personalizado diário com IA', 'coach', 'user'),
    ('feat_nutrition', 'nutrition', 'Consultoria Nutricional', 'Planos alimentares ilimitados e ajustes nutricionais', 'nutrition', 'apple'),
    ('feat_advanced_reports', 'advanced_reports', 'Relatórios Avançados', 'Análise detalhada de progresso com insights de IA', 'reports', 'bar-chart')
ON CONFLICT ("id") DO NOTHING;

