import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateStudyInput } from "./studies.dto";

@Injectable()
export class StudiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string) {
    return this.prisma.study.findMany({ where: { workspaceId } });
  }

  async create(input: CreateStudyInput) {
    return this.prisma.study.create({
      data: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        name: input.name,
        status: input.status,
        language: input.language ?? "en",
        mode: input.mode ?? "voice",
        allowMultipleEntries: input.allowMultipleEntries ?? false,
        allowIncomplete: input.allowIncomplete ?? false,
        screeningLogic: input.screeningLogic ? (input.screeningLogic as Prisma.InputJsonValue) : undefined,
        interviewGuide: input.interviewGuide ? (input.interviewGuide as Prisma.InputJsonValue) : undefined,
        syntheticEnabled: input.syntheticEnabled ?? false,
        quotaTargets: input.quotaTargets ? (input.quotaTargets as Prisma.InputJsonValue) : undefined,
        localizationChecklist: input.localizationChecklist
          ? (input.localizationChecklist as Prisma.InputJsonValue)
          : undefined,
        recruitmentChecklist: input.recruitmentChecklist
          ? (input.recruitmentChecklist as Prisma.InputJsonValue)
          : undefined,
        activationChecklist: input.activationChecklist
          ? (input.activationChecklist as Prisma.InputJsonValue)
          : undefined,
        rolloutPlan: input.rolloutPlan ? (input.rolloutPlan as Prisma.InputJsonValue) : undefined,
        distributionTracking: input.distributionTracking
          ? (input.distributionTracking as Prisma.InputJsonValue)
          : undefined,
        deliveryHealth: input.deliveryHealth ? (input.deliveryHealth as Prisma.InputJsonValue) : undefined,
      }
    });
  }

  async buildFromBrief(studyId: string, brief: string) {
    const trimmed = brief.trim();
    const topic = trimmed.split("\n")[0]?.slice(0, 120) || "study topic";
    const interviewGuide = {
      title: `Interview guide for ${topic}`,
      questions: [
        {
          id: "q1",
          text: "Tell me about your most recent experience with this topic.",
          probe: "What stood out the most and why?"
        },
        {
          id: "q2",
          text: "What problems or frustrations do you face today?",
          probe: "Can you share a specific moment?"
        },
        {
          id: "q3",
          text: "How do you currently solve this, and what alternatives have you tried?",
          probe: "What worked and what did not?"
        },
        {
          id: "q4",
          text: "What would an ideal solution look like?",
          probe: "Which features matter most?"
        },
        {
          id: "q5",
          text: "How likely are you to recommend a solution that fits those needs?",
          probe: "What would increase your confidence?"
        }
      ]
    };
    const screeningLogic = {
      requiredFields: ["market", "role"],
      screenOutRules: [
        {
          field: "role",
          condition: "equals",
          value: "student",
          outcome: "screen_out"
        }
      ],
      allowedLanguages: ["en"]
    };

    return this.prisma.study.update({
      where: { id: studyId },
      data: {
        interviewGuide,
        screeningLogic
      }
    });
  }

  async syntheticAnswer(studyId: string, prompt: string) {
    const study = await this.prisma.study.findUnique({ where: { id: studyId } });
    const language = study?.language ?? "en";
    return {
      studyId,
      language,
      answer: `Synthetic preview (${language}): ${prompt.trim().slice(0, 200)}...`
    };
  }

  async segmentSummary(studyId: string) {
    const participants = await this.prisma.participant.findMany({
      where: { studyId },
      select: { segment: true },
    });
    const counts = participants.reduce<Record<string, number>>((acc, participant) => {
      const key = participant.segment || "unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return { studyId, segments: counts };
  }

  async updateLocalizationChecklist(studyId: string, checklist: Record<string, boolean>) {
    return this.prisma.study.update({
      where: { id: studyId },
      data: { localizationChecklist: checklist as Prisma.InputJsonValue },
    });
  }

  async updateRecruitmentChecklist(studyId: string, checklist: Record<string, boolean>) {
    return this.prisma.study.update({
      where: { id: studyId },
      data: { recruitmentChecklist: checklist as Prisma.InputJsonValue },
    });
  }

  async updateQuotaTargets(studyId: string, quotaTargets: Record<string, number>) {
    return this.prisma.study.update({
      where: { id: studyId },
      data: { quotaTargets: quotaTargets as Prisma.InputJsonValue },
    });
  }

  async quotaStatus(studyId: string) {
    const study = await this.prisma.study.findUnique({
      where: { id: studyId },
      select: { quotaTargets: true },
    });
    const participants = await this.prisma.participant.findMany({
      where: { studyId },
      select: { segment: true },
    });
    const actuals = participants.reduce<Record<string, number>>((acc, participant) => {
      const key = participant.segment || "unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const targets = (study?.quotaTargets as Record<string, number> | null) ?? {};
    const status = Object.entries(targets).map(([segment, target]) => ({
      segment,
      target,
      actual: actuals[segment] ?? 0,
    }));
    return { studyId, targets, actuals, status };
  }

  async updateActivationChecklist(studyId: string, checklist: Record<string, boolean>) {
    return this.prisma.study.update({
      where: { id: studyId },
      data: { activationChecklist: checklist as Prisma.InputJsonValue },
    });
  }

  async updateRolloutPlan(studyId: string, rolloutPlan: { markets: string[]; status?: string }) {
    return this.prisma.study.update({
      where: { id: studyId },
      data: { rolloutPlan: rolloutPlan as Prisma.InputJsonValue },
    });
  }

  async updateDistributionTracking(
    studyId: string,
    distributionTracking: { channels: string[]; measurement?: string },
  ) {
    return this.prisma.study.update({
      where: { id: studyId },
      data: { distributionTracking: distributionTracking as Prisma.InputJsonValue },
    });
  }

  async updateDeliveryHealth(
    studyId: string,
    deliveryHealth: { score: number; status: string; notes?: string },
  ) {
    return this.prisma.study.update({
      where: { id: studyId },
      data: { deliveryHealth: deliveryHealth as Prisma.InputJsonValue },
    });
  }
}
