ALTER TABLE "AdminLoginAttempt" ADD COLUMN "emailHash" TEXT;
CREATE INDEX "AdminLoginAttempt_emailHash_createdAt_idx" ON "AdminLoginAttempt"("emailHash", "createdAt");

CREATE TABLE "AdminLoginCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminLoginCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminLoginCode_emailHash_used_expiresAt_idx" ON "AdminLoginCode"("emailHash", "used", "expiresAt");
CREATE INDEX "AdminLoginCode_expiresAt_used_idx" ON "AdminLoginCode"("expiresAt", "used");
