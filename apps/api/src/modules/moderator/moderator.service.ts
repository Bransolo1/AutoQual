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

  private getLocalizedPrompts(locale: string) {
    const normalized = locale.toLowerCase();
    if (normalized.startsWith("es")) {
      return {
        termination: "Gracias por compartir. Vamos a pausar aquí por ahora.",
        warning: "Gracias por compartir. Continuemos con la siguiente pregunta.",
      };
    }
    if (normalized.startsWith("fr")) {
      return {
        termination: "Merci pour votre partage. Nous allons nous arrêter ici pour le moment.",
        warning: "Merci pour votre partage. Passons à la question suivante.",
      };
    }
    return {
      termination: "Thanks for sharing. We'll pause here for now.",
      warning: "Thanks for sharing. Let's move to the next question.",
    };
  }

  private evaluateSafety(lastUserMessage?: string) {
    if (!lastUserMessage) {
      return { action: "continue" as const };
    }
    const lowered = lastUserMessage.toLowerCase();
    const disallowed = ["self-harm", "suicide", "kill myself", "harm myself"];
    const flagged = disallowed.find((term) => lowered.includes(term));
    if (flagged) {
      return { action: "terminate" as const, reason: `flagged_${flagged.replace(/\s+/g, "_")}` };
    }
    return { action: "continue" as const };
  }

  private getGuideQuestions(guide?: {
    questions?: Array<{ text?: string; probe?: string }>;
    sections?: Array<{ questions?: Array<{ text?: string; probe?: string }> }>;
    stopConditions?: { maxTurns?: number };
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
    const participantTurns = await this.prisma.turn.count({
      where: { sessionId, speaker: "participant" },
    });
    let prompt = getNextModeratorPrompt({
      turnCount,
      lastUserMessage,
    });
    const guide = session?.study?.interviewGuide as
      | {
          questions?: Array<{ text?: string; probe?: string }>;
          sections?: Array<{ questions?: Array<{ text?: string; probe?: string }> }>;
          stopConditions?: { maxTurns?: number };
        }
      | undefined;
    const questions = this.getGuideQuestions(guide);
    const locale = session?.study?.language ?? "en";
    const { termination, warning } = this.getLocalizedPrompts(locale);
    const policy = this.evaluateSafety(lastUserMessage);
    const maxTurns = guide?.stopConditions?.maxTurns;
    if (typeof maxTurns === "number" && participantTurns >= maxTurns) {
      return {
        prompt: termination,
        fallbackPrompt: termination,
        prefetch: [],
        policyAction: "terminate",
        reasoningLog: {
          turnCount,
          participantTurns,
          lastUserMessage: lastUserMessage ?? null,
          guideUsed: questions.length > 0,
          latencyMode,
          prefetchCount,
          stopReason: "max_turns",
        },
      };
    }
    if (policy.action === "terminate") {
      return {
        prompt: termination,
        fallbackPrompt: termination,
        prefetch: [],
        policyAction: "terminate",
        reasoningLog: {
          turnCount,
          participantTurns,
          lastUserMessage: lastUserMessage ?? null,
          guideUsed: questions.length > 0,
          latencyMode,
          prefetchCount,
          stopReason: policy.reason,
        },
      };
    }

    const index = Math.min(participantTurns, Math.max(questions.length - 1, 0));
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
      policyAction: policy.action === "continue" ? "continue" : "warn",
      reasoningLog: {
        turnCount,
        participantTurns,
        lastUserMessage: lastUserMessage ?? null,
        guideUsed: questions.length > 0,
        latencyMode,
        prefetchCount,
        nextQuestionIndex: index,
        stopConditions: guide?.stopConditions ?? null,
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
