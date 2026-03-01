-- Create ShareChecklist table for persisted share actions
CREATE TABLE "ShareChecklist" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareChecklist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShareChecklist_projectId_key" ON "ShareChecklist"("projectId");

ALTER TABLE "ShareChecklist"
ADD CONSTRAINT "ShareChecklist_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShareChecklist"
ADD CONSTRAINT "ShareChecklist_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
