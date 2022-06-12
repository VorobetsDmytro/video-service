-- CreateTable
CREATE TABLE "ChangeEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "newEmail" TEXT NOT NULL,

    CONSTRAINT "ChangeEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChangeEmail_userId_key" ON "ChangeEmail"("userId");

-- AddForeignKey
ALTER TABLE "ChangeEmail" ADD CONSTRAINT "ChangeEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
