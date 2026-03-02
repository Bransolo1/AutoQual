import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TranscriptsService } from "./transcripts.service";
import {
  CreateTranscriptInput,
  CreateTranscriptSpanInput,
  DetectPiiInput,
  RedactTranscriptInput,
  UnredactTranscriptInput,
} from "./transcripts.dto";
import { Roles } from "../../auth/roles.decorator";

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

  @Post(":id/detect-pii")
  detectPii(@Param("id") id: string, @Body() input: DetectPiiInput) {
    return this.transcriptsService.detectPii(id, input);
  }

  @Get(":id/spans")
  listSpans(@Param("id") id: string) {
    return this.transcriptsService.listSpans(id);
  }

  @Post(":id/spans")
  createSpan(@Param("id") id: string, @Body() input: CreateTranscriptSpanInput) {
    return this.transcriptsService.createSpan(id, input);
  }

  @Post(":id/unredact")
  @Roles("admin")
  unredact(@Param("id") id: string, @Body() input: UnredactTranscriptInput) {
    return this.transcriptsService.unredact(id, input);
  }
}
