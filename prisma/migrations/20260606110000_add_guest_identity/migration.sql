-- CreateTable
CREATE TABLE "GuestIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestIdentity_userId_key" ON "GuestIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestIdentity_tokenHash_key" ON "GuestIdentity"("tokenHash");

-- AddForeignKey
ALTER TABLE "GuestIdentity" ADD CONSTRAINT "GuestIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
