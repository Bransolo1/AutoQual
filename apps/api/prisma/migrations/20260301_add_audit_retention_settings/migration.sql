-- Add audit retention settings to workspace
ALTER TABLE "Workspace"
ADD COLUMN "auditRetentionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "auditRetentionDays" INTEGER NOT NULL DEFAULT 365;
