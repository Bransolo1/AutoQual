CREATE TABLE "RevokedToken" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "jti" TEXT NOT NULL,
    "revokedReason" TEXT,
    "revokedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RevokedToken_jti_key" ON "RevokedToken"("jti");
CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");

ALTER TABLE "RevokedToken"
ADD CONSTRAINT "RevokedToken_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RevokedToken"
ADD CONSTRAINT "RevokedToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
