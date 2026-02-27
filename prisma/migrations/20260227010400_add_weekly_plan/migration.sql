-- AlterTable
ALTER TABLE "students" ADD COLUMN "weekOverride" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "weekly_plans" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Meu Plano Semanal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_slots" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "workoutId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plan_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_plans_studentId_key" ON "weekly_plans"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_slots_workoutId_key" ON "plan_slots"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_slots_weeklyPlanId_dayOfWeek_key" ON "plan_slots"("weeklyPlanId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "plan_slots_weeklyPlanId_idx" ON "plan_slots"("weeklyPlanId");

-- AddForeignKey
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_slots" ADD CONSTRAINT "plan_slots_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_slots" ADD CONSTRAINT "plan_slots_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
