/**
 * Migration operacional para integrar adimplencia ao modulo de catracas.
 *
 * Execute:
 * - npm run migration:apply -- --script=apply-access-authorization-eligibility-migration.js
 * - node apps/web/scripts/migration/apply-access-authorization-eligibility-migration.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const rootDir = path.resolve(__dirname, "..", "..", "..", "..");

function stripWrappingQuotes(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnvFileIfPresent(relativeFilePath) {
  const absolutePath = path.join(rootDir, relativeFilePath);

  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const contents = fs.readFileSync(absolutePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(trimmed.slice(separatorIndex + 1));

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function ensureDatabaseEnv() {
  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    loadEnvFileIfPresent(".env");
    loadEnvFileIfPresent(".env.docker");
  }

  if (!process.env.DATABASE_URL && process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
  }

  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }

  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    throw new Error(
      "DATABASE_URL ou DIRECT_URL nao configurado para a migration.",
    );
  }
}

function addDays(value, amount) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function evaluateStudentEligibility({ membership, plan, payment, now }) {
  const graceDays = Math.max(0, Number(plan?.graceDays ?? 0));
  const membershipStatus = String(membership?.status ?? "").toLowerCase();
  const paymentStatus = String(payment?.status ?? "").toLowerCase();
  const dueDate = payment?.dueDate
    ? new Date(payment.dueDate)
    : membership?.nextBillingDate
      ? new Date(membership.nextBillingDate)
      : null;

  if (!membership) {
    return {
      authorizationStatus: "inactive",
      financialStatus: "not_applicable",
      reasonCode: "membership_not_found",
      graceUntil: null,
    };
  }

  if (membershipStatus === "pending") {
    return {
      authorizationStatus: "inactive",
      financialStatus: paymentStatus === "paid" ? "paid" : "pending",
      reasonCode: "membership_pending_activation",
      graceUntil: null,
    };
  }

  if (membershipStatus === "suspended") {
    return {
      authorizationStatus: "inactive",
      financialStatus:
        paymentStatus === "overdue"
          ? "overdue"
          : paymentStatus === "pending"
            ? "pending"
            : "not_applicable",
      reasonCode: "membership_suspended",
      graceUntil: null,
    };
  }

  if (membershipStatus === "canceled") {
    return {
      authorizationStatus: "inactive",
      financialStatus: "not_applicable",
      reasonCode: "membership_canceled",
      graceUntil: null,
    };
  }

  if (!payment || paymentStatus === "paid" || paymentStatus === "withdrawn") {
    return {
      authorizationStatus: "eligible",
      financialStatus: "paid",
      reasonCode: "membership_paid_up",
      graceUntil: null,
    };
  }

  if (paymentStatus === "overdue") {
    return {
      authorizationStatus: "blocked",
      financialStatus: "overdue",
      reasonCode: "payment_overdue",
      graceUntil: dueDate && graceDays > 0 ? addDays(dueDate, graceDays) : null,
    };
  }

  if (paymentStatus === "pending") {
    if (!dueDate || dueDate.getTime() >= now.getTime()) {
      return {
        authorizationStatus: "eligible",
        financialStatus: "pending",
        reasonCode: "payment_pending_not_due",
        graceUntil:
          dueDate && graceDays > 0 ? addDays(dueDate, graceDays) : null,
      };
    }

    if (graceDays > 0) {
      const graceUntil = addDays(dueDate, graceDays);
      if (now.getTime() <= graceUntil.getTime()) {
        return {
          authorizationStatus: "grace",
          financialStatus: "pending",
          reasonCode: "payment_in_grace",
          graceUntil,
        };
      }
    }

    return {
      authorizationStatus: "blocked",
      financialStatus: "overdue",
      reasonCode: "payment_overdue_no_grace",
      graceUntil: dueDate && graceDays > 0 ? addDays(dueDate, graceDays) : null,
    };
  }

  return {
    authorizationStatus: "unknown",
    financialStatus: "not_applicable",
    reasonCode: "not_evaluated",
    graceUntil: null,
  };
}

ensureDatabaseEnv();

const prisma = new PrismaClient();

const statements = [
  'ALTER TABLE "membership_plans" ADD COLUMN IF NOT EXISTS "graceDays" INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "membershipId" TEXT',
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "kind" TEXT',
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "periodStart" TIMESTAMP(3)',
  'ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "periodEnd" TIMESTAMP(3)',
  `CREATE TABLE IF NOT EXISTS "access_eligibility_snapshots" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "subjectType" "AccessSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "studentId" TEXT,
    "personalId" TEXT,
    "membershipId" TEXT,
    "personalAffiliationId" TEXT,
    "authorizationStatus" TEXT NOT NULL DEFAULT 'unknown',
    "financialStatus" TEXT NOT NULL DEFAULT 'not_applicable',
    "reasonCode" TEXT NOT NULL DEFAULT 'not_evaluated',
    "graceUntil" TIMESTAMP(3),
    "openPaymentId" TEXT,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_eligibility_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "access_eligibility_snapshots_gym_subject_key" UNIQUE ("gymId", "subjectType", "subjectId")
  )`,
  `CREATE TABLE IF NOT EXISTS "access_authorization_attempts" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "deviceId" TEXT,
    "requestId" TEXT,
    "providerKey" TEXT,
    "source" TEXT NOT NULL DEFAULT 'device',
    "outcome" TEXT NOT NULL DEFAULT 'error',
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "subjectType" "AccessSubjectType",
    "subjectId" TEXT,
    "studentId" TEXT,
    "personalId" TEXT,
    "authorizationStatus" TEXT NOT NULL DEFAULT 'unknown',
    "financialStatus" TEXT NOT NULL DEFAULT 'not_applicable',
    "reasonCode" TEXT NOT NULL DEFAULT 'not_evaluated',
    "identifierType" TEXT,
    "identifierValue" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graceUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_authorization_attempts_pkey" PRIMARY KEY ("id")
  )`,
  'CREATE INDEX IF NOT EXISTS "access_eligibility_snapshots_gym_status_idx" ON "access_eligibility_snapshots"("gymId", "authorizationStatus")',
  'CREATE INDEX IF NOT EXISTS "access_eligibility_snapshots_student_idx" ON "access_eligibility_snapshots"("studentId")',
  'CREATE INDEX IF NOT EXISTS "access_eligibility_snapshots_personal_idx" ON "access_eligibility_snapshots"("personalId")',
  'CREATE INDEX IF NOT EXISTS "access_authorization_attempts_gym_decided_idx" ON "access_authorization_attempts"("gymId", "decidedAt")',
  'CREATE INDEX IF NOT EXISTS "access_authorization_attempts_gym_outcome_idx" ON "access_authorization_attempts"("gymId", "outcome", "decidedAt")',
  'CREATE INDEX IF NOT EXISTS "access_authorization_attempts_device_idx" ON "access_authorization_attempts"("deviceId", "decidedAt")',
  'CREATE INDEX IF NOT EXISTS "access_authorization_attempts_subject_idx" ON "access_authorization_attempts"("gymId", "subjectType", "subjectId", "decidedAt")',
  `UPDATE "payments"
   SET "membershipId" = split_part("reference", ':', 2)
   WHERE "membershipId" IS NULL
     AND "reference" LIKE 'membership:%'`,
  `UPDATE "payments"
   SET "kind" = 'membership_initial'
   WHERE "kind" IS NULL
     AND "membershipId" IS NOT NULL`,
];

async function runStatements() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function backfillSnapshots() {
  const now = new Date();
  const memberships = await prisma.gymMembership.findMany({
    include: {
      plan: true,
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  for (const membership of memberships) {
    const payment = await prisma.payment.findFirst({
      where: {
        gymId: membership.gymId,
        studentId: membership.studentId,
        OR: [
          { membershipId: membership.id },
          { reference: { startsWith: `membership:${membership.id}` } },
        ],
        status: { in: ["pending", "overdue"] },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    const decision = evaluateStudentEligibility({
      membership,
      plan: membership.plan,
      payment,
      now,
    });

    await prisma.accessEligibilitySnapshot.upsert({
      where: {
        gymId_subjectType_subjectId: {
          gymId: membership.gymId,
          subjectType: "STUDENT",
          subjectId: membership.studentId,
        },
      },
      create: {
        gymId: membership.gymId,
        subjectType: "STUDENT",
        subjectId: membership.studentId,
        studentId: membership.studentId,
        membershipId: membership.id,
        authorizationStatus: decision.authorizationStatus,
        financialStatus: decision.financialStatus,
        reasonCode: decision.reasonCode,
        graceUntil: decision.graceUntil,
        openPaymentId: payment?.id ?? null,
        lastEvaluatedAt: now,
      },
      update: {
        studentId: membership.studentId,
        membershipId: membership.id,
        authorizationStatus: decision.authorizationStatus,
        financialStatus: decision.financialStatus,
        reasonCode: decision.reasonCode,
        graceUntil: decision.graceUntil,
        openPaymentId: payment?.id ?? null,
        lastEvaluatedAt: now,
      },
    });
  }

  const affiliations = await prisma.gymPersonalAffiliation.findMany();
  for (const affiliation of affiliations) {
    await prisma.accessEligibilitySnapshot.upsert({
      where: {
        gymId_subjectType_subjectId: {
          gymId: affiliation.gymId,
          subjectType: "PERSONAL",
          subjectId: affiliation.personalId,
        },
      },
      create: {
        gymId: affiliation.gymId,
        subjectType: "PERSONAL",
        subjectId: affiliation.personalId,
        personalId: affiliation.personalId,
        personalAffiliationId: affiliation.id,
        authorizationStatus:
          affiliation.status === "active" ? "eligible" : "inactive",
        financialStatus: "not_applicable",
        reasonCode:
          affiliation.status === "active"
            ? "personal_affiliation_active"
            : "personal_affiliation_inactive",
        lastEvaluatedAt: now,
      },
      update: {
        personalId: affiliation.personalId,
        personalAffiliationId: affiliation.id,
        authorizationStatus:
          affiliation.status === "active" ? "eligible" : "inactive",
        financialStatus: "not_applicable",
        reasonCode:
          affiliation.status === "active"
            ? "personal_affiliation_active"
            : "personal_affiliation_inactive",
        lastEvaluatedAt: now,
      },
    });
  }
}

async function printValidation() {
  const counts = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*) FROM "access_eligibility_snapshots")::int AS "snapshots",
      (SELECT COUNT(*) FROM "access_authorization_attempts")::int AS "attempts",
      (SELECT COUNT(*) FROM "payments" WHERE "membershipId" IS NOT NULL)::int AS "paymentsWithMembershipId",
      (SELECT COUNT(*) FROM "membership_plans" WHERE "graceDays" IS NOT NULL)::int AS "plansWithGraceDays"
  `);

  const snapshot = Array.isArray(counts) ? counts[0] : counts;
  console.log("[migration] contagens:");
  console.log(`- access_eligibility_snapshots: ${snapshot.snapshots}`);
  console.log(`- access_authorization_attempts: ${snapshot.attempts}`);
  console.log(`- payments com membershipId: ${snapshot.paymentsWithMembershipId}`);
  console.log(`- planos com graceDays: ${snapshot.plansWithGraceDays}`);
}

async function applyMigration() {
  console.log("[migration] aplicando access authorization eligibility...\n");
  await runStatements();
  await backfillSnapshots();
  await printValidation();
  console.log("\n[migration] access authorization eligibility pronto");
}

if (require.main === module) {
  applyMigration()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(
        "\n[migration] erro ao aplicar access authorization eligibility:",
        error.message,
      );
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { applyMigration };
