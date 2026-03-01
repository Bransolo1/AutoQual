import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ThemesService } from "./themes.service";
import { CreateThemeInput } from "./themes.dto";

@Controller("themes")
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get()
  list(@Query("studyId") studyId: string) {
    return this.themesService.list(studyId);
  }

  @Post()
  create(@Body() input: CreateThemeInput) {
    return this.themesService.create(input);
  }
}
