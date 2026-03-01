import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { ExportsService } from "./exports.service";
import { CreateExportInput } from "./exports.dto";

@Controller("exports")
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get()
  list(@Query("studyId") studyId: string) {
    return this.exportsService.list(studyId);
  }

  @Get("study/:studyId/markdown")
  async getMarkdown(@Param("studyId") studyId: string, @Res() res: Response) {
    const markdown = await this.exportsService.generateMarkdown(studyId);
    res.type("text/markdown").send(markdown);
  }

  @Get("study/:studyId/json")
  async getJson(@Param("studyId") studyId: string, @Res() res: Response) {
    const json = await this.exportsService.generateJson(studyId);
    res.json(json);
  }

  @Get("study/:studyId/ppt-outline")
  async getPptOutline(@Param("studyId") studyId: string, @Res() res: Response) {
    const outline = await this.exportsService.generatePptOutline(studyId);
    res.json({ slides: outline });
  }

  @Get("study/:studyId/audio-recap")
  async getAudioRecap(@Param("studyId") studyId: string, @Res() res: Response) {
    const recap = await this.exportsService.generateAudioRecap(studyId);
    res.json(recap);
  }

  @Get("study/:studyId/pdf")
  async getPdf(@Param("studyId") studyId: string, @Res() res: Response) {
    const pdf = await this.exportsService.generatePdf(studyId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
    res.send(pdf);
  }

  @Get("study/:studyId/evidence-bundle")
  async getEvidenceBundle(@Param("studyId") studyId: string, @Res() res: Response) {
    const bundle = await this.exportsService.generateEvidenceBundle(studyId);
    res.json(bundle);
  }

  @Get("study/:studyId/evidence-bundle.csv")
  async getEvidenceBundleCsv(@Param("studyId") studyId: string, @Res() res: Response) {
    const bundle = await this.exportsService.generateEvidenceBundle(studyId);
    const rows = [
      ["clipId", "mediaArtifactId", "startMs", "endMs", "storageKey"],
      ...bundle.clips.map((clip) => [
        clip.id,
        clip.mediaArtifactId,
        clip.startMs,
        clip.endMs,
        clip.storageKey.replaceAll('"', '""'),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=evidence-bundle.csv");
    res.send(csv);
  }

  @Get("study/:studyId/deliverables")
  async getDeliverables(@Param("studyId") studyId: string) {
    return this.exportsService.generateDeliverables(studyId);
  }

  @Get("story/:storyId/markdown")
  async getStoryMarkdown(@Param("storyId") storyId: string, @Res() res: Response) {
    const markdown = await this.exportsService.generateStoryMarkdown(storyId);
    res.type("text/markdown").send(markdown);
  }

  @Get("story/:storyId/pdf")
  async getStoryPdf(@Param("storyId") storyId: string, @Res() res: Response) {
    const pdf = await this.exportsService.generateStoryPdf(storyId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=story.pdf");
    res.send(pdf);
  }

  @Get("story/:storyId/audio-script")
  async getStoryAudioScript(@Param("storyId") storyId: string, @Res() res: Response) {
    const script = await this.exportsService.generateStoryAudioScript(storyId);
    res.json(script);
  }

  @Post()
  create(@Body() input: CreateExportInput) {
    return this.exportsService.create(input);
  }
}
