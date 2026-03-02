-- Add alert views for saved filters
CREATE TABLE "AlertView" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "filters" JSONB NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AlertView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AlertView_workspaceId_name_key" ON "AlertView"("workspaceId", "name");

ALTER TABLE "AlertView"
ADD CONSTRAINT "AlertView_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
