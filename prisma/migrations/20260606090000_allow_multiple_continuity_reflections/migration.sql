-- DropIndex
DROP INDEX "ContinuityReflection_userId_key";

-- CreateIndex
CREATE INDEX "ContinuityReflection_userId_updatedAt_idx" ON "ContinuityReflection"("userId", "updatedAt");
