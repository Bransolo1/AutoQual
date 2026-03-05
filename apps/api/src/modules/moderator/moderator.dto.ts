export type NextTurnInput = {
  lastUserMessage?: string;
  prefetchCount?: number;
  latencyMode?: "fast" | "default";
  depth?: "quick" | "balanced" | "reflective";
};
