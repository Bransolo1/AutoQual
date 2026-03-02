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
