import { Controller, Get, Param } from "@nestjs/common";
import { AnalysisService } from "./analysis.service";

@Controller("analysis")
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get("study/:studyId/summary")
  async summary(@Param("studyId") studyId: string) {
    return this.analysisService.summary(studyId);
  }
}
