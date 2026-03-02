import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ParticipantsService } from "./participants.service";
import {
  CreateParticipantInput,
  RecruitParticipantsInput,
  ScreenParticipantInput,
  VerifyParticipantInput,
  VerifyParticipantsBulkInput,
} from "./participants.dto";

@Controller("participants")
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  list(
    @Query("studyId") studyId?: string,
    @Query("workspaceId") workspaceId?: string,
    @Query("status") status?: string,
  ) {
    return this.participantsService.list({ studyId, workspaceId, status });
  }

  @Post()
  create(@Body() input: CreateParticipantInput) {
    return this.participantsService.create(input);
  }

  @Post("recruit")
  recruit(@Body() input: RecruitParticipantsInput) {
    return this.participantsService.recruit(input);
  }

  @Post("screen")
  screen(@Body() input: ScreenParticipantInput) {
    return this.participantsService.screen(input);
  }

  @Patch(":id/verify")
  verify(@Param("id") id: string, @Body() input: VerifyParticipantInput) {
    return this.participantsService.verify(id, input);
  }

  @Post("verify-bulk")
  verifyBulk(@Body() input: VerifyParticipantsBulkInput) {
    return this.participantsService.verifyBulk(input);
  }
}
