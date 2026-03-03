-- Add slug, billingStatus, trialEndsAt to Workspace
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "billingStatus" TEXT NOT NULL DEFAULT 'trialing';
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- Make slug unique (back-fill existing rows first)
UPDATE "Workspace" SET "slug" = LOWER(REPLACE("name", ' ', '-')) || '-' || SUBSTR("id", 1, 6) WHERE "slug" IS NULL;
ALTER TABLE "Workspace" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_slug_key" ON "Workspace"("slug");

-- WorkspaceInvitation table
CREATE TABLE IF NOT EXISTS "WorkspaceInvitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'researcher',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceInvitation_token_key" ON "WorkspaceInvitation"("token");
ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
