-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionCartId" TEXT NOT NULL,
    "userId" UUID,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionCartId_idx" ON "AnalyticsEvent"("sessionCartId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_path_idx" ON "AnalyticsEvent"("path");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
