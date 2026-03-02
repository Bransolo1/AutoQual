import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { StoriesService } from "./stories.service";
import { CreateStoryInput, GenerateStoryInput } from "./stories.dto";
import { Response } from "express";

@Controller("stories")
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  list(@Query("studyId") studyId: string) {
    return this.storiesService.list(studyId);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.storiesService.get(id);
  }

  @Get(":id/markdown")
  async getMarkdown(@Param("id") id: string, @Res() res: Response) {
    const markdown = await this.storiesService.generateMarkdown(id);
    res.type("text/markdown").send(markdown);
  }

  @Get(":id/pdf")
  async getPdf(@Param("id") id: string, @Res() res: Response) {
    const pdf = await this.storiesService.generatePdf(id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=story.pdf");
    res.send(pdf);
  }

  @Post()
  create(@Body() input: CreateStoryInput) {
    return this.storiesService.create(input);
  }

  @Post("generate")
  generate(@Body() input: GenerateStoryInput) {
    return this.storiesService.generate(input.studyId);
  }

  @Get(":id/export/:type")
  exportStory(@Param("id") id: string, @Param("type") type: string) {
    return this.storiesService.generateExport(id, type);
  }
}
