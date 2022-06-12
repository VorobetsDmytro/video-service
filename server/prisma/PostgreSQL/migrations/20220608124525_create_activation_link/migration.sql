-- CreateTable
CREATE TABLE "Activationlink" (
    "userId" TEXT,
    "link" TEXT NOT NULL,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Activationlink_pkey" PRIMARY KEY ("link")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activationlink_userId_key" ON "Activationlink"("userId");

-- AddForeignKey
ALTER TABLE "Activationlink" ADD CONSTRAINT "Activationlink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
