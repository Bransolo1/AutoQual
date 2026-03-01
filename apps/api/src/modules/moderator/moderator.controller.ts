import { Body, Controller, Param, Post, Query } from "@nestjs/common";
import { ModeratorService } from "./moderator.service";
import { NextTurnInput } from "./moderator.dto";

@Controller("moderator")
export class ModeratorController {
  constructor(private readonly moderatorService: ModeratorService) {}

  @Post(":sessionId/next-turn")
  getNextTurn(@Param("sessionId") sessionId: string, @Body() input: NextTurnInput) {
    return this.moderatorService.getNextTurn(
      sessionId,
      input.lastUserMessage,
      input.prefetchCount,
      input.latencyMode ?? "default",
    );
  }

  @Post(":sessionId/prefetch")
  getPrefetch(@Param("sessionId") sessionId: string, @Query("count") count?: string) {
    const parsed = count ? Number(count) : undefined;
    return this.moderatorService.getPrefetch(sessionId, Number.isFinite(parsed) ? parsed : undefined);
  }
}
