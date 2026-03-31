-- CreateTable
CREATE TABLE "mobile_installations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "expoPushToken" TEXT,
    "pushPermission" TEXT NOT NULL DEFAULT 'undetermined',
    "capabilities" JSONB,
    "appVersion" TEXT,
    "deviceName" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mobile_installations_userId_active_idx" ON "mobile_installations"("userId", "active");

-- CreateIndex
CREATE INDEX "mobile_installations_expoPushToken_idx" ON "mobile_installations"("expoPushToken");

-- AddForeignKey
ALTER TABLE "mobile_installations"
ADD CONSTRAINT "mobile_installations_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
