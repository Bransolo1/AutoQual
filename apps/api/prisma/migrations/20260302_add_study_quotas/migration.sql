-- Add quota targets to study
ALTER TABLE "Study"
ADD COLUMN "quotaTargets" JSONB;
