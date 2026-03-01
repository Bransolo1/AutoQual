import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TranscriptsService } from "./transcripts.service";
import { CreateTranscriptInput, RedactTranscriptInput } from "./transcripts.dto";

@Controller("transcripts")
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  @Get()
  list(@Query("sessionId") sessionId: string) {
    return this.transcriptsService.list(sessionId);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.transcriptsService.getById(id);
  }

  @Post()
  create(@Body() input: CreateTranscriptInput) {
    return this.transcriptsService.create(input);
  }

  @Patch(":id/redact")
  redact(@Param("id") id: string, @Body() input: RedactTranscriptInput) {
    return this.transcriptsService.redact(id, input);
  }
}
