export type InsightAdapter = (
  input: Record<string, unknown>
) => Promise<{ status: string; raw?: unknown; result?: Record<string, unknown> }>;

const extractJson = (value: string) => {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(value.slice(start, end + 1));
  } catch {
    return null;
  }
};

export const adapters = {
  openai: async (input: Record<string, unknown>) => {
    if (!process.env.OPENAI_API_KEY) return { status: "not_configured" };
    const prompt = String(input.prompt ?? input.transcriptText ?? "");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? extractJson(content) : null;
    return { status: "ok", raw: data, result: parsed ?? undefined };
  },
  anthropic: async (input: Record<string, unknown>) => {
    if (!process.env.ANTHROPIC_API_KEY) return { status: "not_configured" };
    const prompt = String(input.prompt ?? input.transcriptText ?? "");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    const parsed = typeof text === "string" ? extractJson(text) : null;
    return { status: "ok", raw: data, result: parsed ?? undefined };
  },
};

export { getNextModeratorPrompt } from "./moderator-prompt";
export type { ModeratorContext } from "./moderator-prompt";

// ─── Chat completion helpers for the moderator engine ────────────────────────

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

async function callOpenAIChat(
  messages: ChatMessage[],
  maxTokens = 512,
  temperature = 0.7,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}

async function callAnthropicChat(
  messages: ChatMessage[],
  maxTokens = 512,
  temperature = 0.7,
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  // Anthropic separates system messages from the messages array
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const userMessages = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
      max_tokens: maxTokens,
      temperature,
      system: systemMsg || undefined,
      messages: userMessages,
    }),
  });
  const data = await res.json() as { content?: Array<{ text?: string }> };
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Empty response from Anthropic");
  return text;
}

/**
 * Generate the next moderator utterance (question / probe / transition).
 * Falls back to throwing so the caller can use the static rule-based fallback.
 */
export async function moderateTurn(opts: {
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens?: number;
  depth?: "quick" | "balanced" | "reflective";
}): Promise<{ text: string; provider: string; latencyMs: number }> {
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  const t0 = Date.now();

  const depthInstruction =
    opts.depth === "quick"
      ? "Keep responses concise. Ask at most ONE follow-up probe per question before moving on."
      : opts.depth === "reflective"
      ? "Probe deeply. Ask clarifying and reflective follow-up questions (up to 3 probes) until the participant's reasoning is fully explored before moving to the next question."
      : "Balance depth and pace. Ask up to TWO follow-up probes before moving to the next question.";

  const systemPromptWithDepth = `${opts.systemPrompt}\n\nINTERVIEW DEPTH: ${depthInstruction}`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPromptWithDepth },
    ...opts.messages,
  ];

  let text: string;
  if (provider === "openai") {
    text = await callOpenAIChat(messages, opts.maxTokens ?? 256, 0.7);
  } else if (provider === "anthropic") {
    text = await callAnthropicChat(messages, opts.maxTokens ?? 256, 0.7);
  } else {
    throw new Error("mock provider — use fallback");
  }

  return { text: text.trim(), provider, latencyMs: Date.now() - t0 };
}

/**
 * Score a participant response against a guide question for sufficiency.
 * Returns score 0.0–1.0 and a short reason string.
 * Falls back to { score: 1.0, reason: "fallback" } on any error.
 */
export async function scoreResponse(opts: {
  question: string;
  response: string;
}): Promise<{ score: number; reason: string }> {
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  const systemPrompt =
    "You are a qualitative research moderator evaluating participant response quality. " +
    "Return ONLY valid JSON in this exact format: {\"score\": 0.0, \"reason\": \"brief explanation\"}. " +
    "Score from 0.0 (completely inadequate) to 1.0 (thorough and insightful). " +
    "Consider: specificity, depth, relevance to the question asked.";
  const userMsg = `Question: ${opts.question}\n\nParticipant response: ${opts.response}`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMsg },
  ];

  try {
    let raw: string;
    if (provider === "openai") {
      raw = await callOpenAIChat(messages, 128, 0);
    } else if (provider === "anthropic") {
      raw = await callAnthropicChat(messages, 128, 0);
    } else {
      return { score: 1.0, reason: "mock-provider-skip" };
    }
    const parsed = extractJson(raw) as { score?: number; reason?: string } | null;
    return {
      score: typeof parsed?.score === "number" ? Math.max(0, Math.min(1, parsed.score)) : 1.0,
      reason: parsed?.reason ?? "no-reason",
    };
  } catch {
    return { score: 1.0, reason: "error-fallback" };
  }
}
