export type ModeratorContext = {
  turnCount: number;
  lastUserMessage?: string;
  studyTopic?: string;
};

export function getNextModeratorPrompt(context: ModeratorContext): string {
  const { turnCount, lastUserMessage } = context;
  if (turnCount === 0) {
    return "Thanks for joining. Can you tell me about your most recent experience with the product?";
  }
  if (turnCount < 3) {
    return "What stood out to you most during that experience, and why?";
  }
  if (lastUserMessage && lastUserMessage.length < 40) {
    return "Can you share a bit more detail about that moment?";
  }
  return "If you could change one thing to improve that experience, what would it be?";
}
