-- Add Stripe billing fields and SSO config to Workspace
ALTER TABLE "Workspace"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"     TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "ssoConfig"            JSONB;
