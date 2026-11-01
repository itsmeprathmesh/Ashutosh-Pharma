CREATE TABLE "PublicRateLimitAttempt" (
    "id" SERIAL NOT NULL,
    "route" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicRateLimitAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PublicRateLimitAttempt_route_ipHash_createdAt_idx" ON "PublicRateLimitAttempt"("route", "ipHash", "createdAt");
CREATE INDEX "PublicRateLimitAttempt_createdAt_idx" ON "PublicRateLimitAttempt"("createdAt");
