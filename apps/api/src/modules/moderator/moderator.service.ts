import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { getNextModeratorPrompt } from "../../../../../packages/ai-adapters/src";

@Injectable()
export class ModeratorService {
  constructor(private readonly prisma: PrismaService) {}

  private buildQuestionPrompt(question?: { text?: string; probe?: string }) {
    if (!question) return null;
    const probe = question.probe ? ` Probe: ${question.probe}` : "";
    return `${question.text ?? ""}${probe}`.trim();
  }

  private getGuideQuestions(guide?: {
    questions?: Array<{ text?: string; probe?: string }>;
    sections?: Array<{ questions?: Array<{ text?: string; probe?: string }> }>;
  }) {
    if (!guide) return [];
    if (Array.isArray(guide.sections) && guide.sections.length > 0) {
      return guide.sections.flatMap((section) => section.questions ?? []);
    }
    return guide.questions ?? [];
  }

  async getNextTurn(
    sessionId: string,
    lastUserMessage?: string,
    prefetchCount = 2,
    latencyMode: "fast" | "default" = "default",
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { study: true },
    });
    const turnCount = await this.prisma.turn.count({ where: { sessionId } });
    let prompt = getNextModeratorPrompt({
      turnCount,
      lastUserMessage,
    });
    const guide = session?.study?.interviewGuide as
      | {
          questions?: Array<{ text?: string; probe?: string }>;
          sections?: Array<{ questions?: Array<{ text?: string; probe?: string }> }>;
        }
      | undefined;
    const questions = this.getGuideQuestions(guide);
    const index = Math.min(turnCount, Math.max(questions.length - 1, 0));
    const fallbackPrompt =
      this.buildQuestionPrompt(questions[index]) ??
      "Thanks for sharing. Can you tell me a little more?";
    if (questions.length > 0) {
      const questionPrompt = this.buildQuestionPrompt(questions[index]);
      if (questionPrompt) {
        prompt = questionPrompt;
      }
    }
    if (latencyMode === "fast") {
      prompt = prompt || fallbackPrompt;
    }
    const prefetch: string[] = [];
    if (questions.length > 0 && prefetchCount > 0) {
      for (let i = 1; i <= prefetchCount; i += 1) {
        const nextPrompt = this.buildQuestionPrompt(questions[index + i]);
        if (nextPrompt) prefetch.push(nextPrompt);
      }
    }
    return {
      prompt,
      fallbackPrompt,
      prefetch,
      reasoningLog: {
        turnCount,
        lastUserMessage: lastUserMessage ?? null,
        guideUsed: questions.length > 0,
        latencyMode,
        prefetchCount,
      },
    };
  }

  async getPrefetch(sessionId: string, count = 3) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { study: true },
    });
    const guide = session?.study?.interviewGuide as
      | {
          questions?: Array<{ text?: string; probe?: string }>;
          sections?: Array<{ questions?: Array<{ text?: string; probe?: string }> }>;
        }
      | undefined;
    const questions = this.getGuideQuestions(guide);
    const prefetch = questions
      .slice(0, Math.max(0, count))
      .map((question) => this.buildQuestionPrompt(question))
      .filter((prompt): prompt is string => Boolean(prompt));
    return { prefetch };
  }
}
