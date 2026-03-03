import { PrismaClient } from "@prisma/client";
import { DEFAULT_MILESTONES, MILESTONE_TASK_TEMPLATES } from "./modules/projects/intake-templates";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.warn("Seed script is disabled in production. Use the workspace onboarding API instead.");
    return;
  }
  const DEMO_WORKSPACE_ID = "demo-workspace-id";
  const workspace = await prisma.workspace.upsert({
    where: { id: DEMO_WORKSPACE_ID },
    create: { id: DEMO_WORKSPACE_ID, name: "Demo Workspace" },
    update: {},
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@sensehub.dev" },
    create: { workspaceId: workspace.id, email: "admin@sensehub.dev", name: "Admin User" },
    update: {},
  });
  const researcher = await prisma.user.upsert({
    where: { email: "researcher@sensehub.dev" },
    create: { workspaceId: workspace.id, email: "researcher@sensehub.dev", name: "Researcher User" },
    update: {},
  });

  const start = new Date();
  const end = new Date(Date.now() + 14 * 86400000);
  const span = (end.getTime() - start.getTime()) / (DEFAULT_MILESTONES.length + 1);

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Retail CX Pulse",
      description: "End-to-end delivery pipeline demo.",
      status: "active",
      ownerUserId: admin.id,
      clientOrgName: "Northwind Retail",
      startDate: start,
      targetDeliveryDate: end,
      tags: ["demo", "retail"],
    },
  });

  await prisma.shareChecklist.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      workspaceId: workspace.id,
      items: {
        "report-summary": true,
        "report-evidence": false,
        "report-top-insights": true,
        "story-comms": false,
        "story-audio": false,
        "story-tags": false,
        "pack-distribute": false,
        "pack-feedback": false,
        "pack-decisions": false,
      },
    },
  });

  for (let i = 0; i < DEFAULT_MILESTONES.length; i++) {
    const name = DEFAULT_MILESTONES[i];
    const dueDate = new Date(start.getTime() + (i + 1) * span);
    const milestone = await prisma.milestone.create({
      data: {
        projectId: project.id,
        name,
        dueDate,
        status: i === 0 ? "in_progress" : i < 4 ? "not_started" : "not_started",
        orderIndex: i + 1,
      },
    });
    const templates = MILESTONE_TASK_TEMPLATES[name] ?? [];
    for (const t of templates) {
      await prisma.task.create({
        data: {
          projectId: project.id,
          milestoneId: milestone.id,
          title: t.title,
          description: t.description,
          status: "todo",
          priority: "medium",
          dueDate,
          dependencies: [],
        },
      });
    }
  }

  const DEMO_STUDY_ID = "demo-study-id";
  const study = await prisma.study.upsert({
    where: { id: DEMO_STUDY_ID },
    create: {
      id: DEMO_STUDY_ID,
      workspaceId: workspace.id,
      projectId: project.id,
      name: "Demo Study - Retail CX",
      status: "active",
    },
    update: {},
  });

  const [p1, p2, p3] = await Promise.all([
    prisma.participant.create({ data: { studyId: study.id, email: "participant1@example.com" } }),
    prisma.participant.create({ data: { studyId: study.id, email: "participant2@example.com" } }),
    prisma.participant.create({ data: { studyId: study.id, email: "participant3@example.com" } }),
  ]);

  const s1 = await prisma.session.create({
    data: { studyId: study.id, participantId: p1.id, status: "completed" },
  });
  const s2 = await prisma.session.create({
    data: { studyId: study.id, participantId: p2.id, status: "completed" },
  });
  await prisma.session.create({
    data: { studyId: study.id, participantId: p3.id, status: "scheduled" },
  });

  await prisma.transcript.create({
    data: {
      sessionId: s1.id,
      content: "Synthetic transcript: Participant discussed checkout experience and suggested clearer CTAs.",
    },
  });
  await prisma.transcript.create({
    data: {
      sessionId: s2.id,
      content: "Synthetic transcript: Participant liked the app speed but wanted better search filters.",
    },
  });

  await prisma.insight.create({
    data: {
      studyId: study.id,
      statement: "Users want clearer call-to-action buttons during checkout.",
      supportingTranscriptSpans: [
        "Participant discussed checkout experience and suggested clearer CTAs.",
      ],
      supportingVideoClips: [],
      confidenceScore: 0.76,
      businessImplication: "Improve CTA clarity to reduce checkout friction.",
      tags: ["checkout", "cta"],
      status: "draft",
      versionNumber: 1,
      reviewerComments: [],
    },
  });

  console.log("Seed complete: workspace", workspace.id, "project", project.id, "study", study.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
