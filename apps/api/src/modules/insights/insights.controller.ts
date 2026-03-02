import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { InsightsService } from "./insights.service";
import {
  AddInsightEvidenceInput,
  CreateInsightInput,
  CreateInsightVersionInput,
  GenerateInsightInput,
} from "./insights.dto";

@Controller("insights")
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  list(@Query("studyId") studyId: string) {
    return this.insightsService.list(studyId);
  }

  @Get("templates")
  templates() {
    return this.insightsService.getTemplates();
  }

  @Get("coverage")
  coverage(@Query("studyId") studyId: string) {
    return this.insightsService.getEvidenceCoverage(studyId);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.insightsService.getById(id);
  }

  @Post()
  create(@Body() input: CreateInsightInput) {
    return this.insightsService.create(input);
  }

  @Post("generate")
  generate(@Body() input: GenerateInsightInput) {
    return this.insightsService.generateFromTranscript(input.studyId, input.transcriptText);
  }

  @Post(":id/versions")
  addVersion(@Param("id") id: string, @Body() input: CreateInsightVersionInput) {
    return this.insightsService.addVersion(id, input);
  }

  @Post(":id/evidence")
  addEvidence(@Param("id") id: string, @Body() input: AddInsightEvidenceInput) {
    return this.insightsService.addEvidence(id, input);
  }
}
