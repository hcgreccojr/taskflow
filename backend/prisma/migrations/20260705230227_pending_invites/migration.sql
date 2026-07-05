-- CreateTable
CREATE TABLE "pending_invites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_invites_email_idx" ON "pending_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pending_invites_organizationId_email_key" ON "pending_invites"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "pending_invites" ADD CONSTRAINT "pending_invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
