-- CreateTable
CREATE TABLE "ContinuityReflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "obstacle" TEXT NOT NULL DEFAULT '',
    "nextAction" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContinuityReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContinuityReflection_userId_key" ON "ContinuityReflection"("userId");

-- AddForeignKey
ALTER TABLE "ContinuityReflection" ADD CONSTRAINT "ContinuityReflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
