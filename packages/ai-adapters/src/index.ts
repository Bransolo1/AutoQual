export type InsightAdapter = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;

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
    return { status: "ok", raw: data };
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
    return { status: "ok", raw: data };
  },
};

export { getNextModeratorPrompt } from "./moderator-prompt";
export type { ModeratorContext } from "./moderator-prompt";
