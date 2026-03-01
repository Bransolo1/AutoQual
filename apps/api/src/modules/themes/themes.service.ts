import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateThemeInput } from "./themes.dto";

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(studyId: string) {
    return this.prisma.theme.findMany({ where: { studyId } });
  }

  async create(input: CreateThemeInput) {
    return this.prisma.theme.create({
      data: {
        studyId: input.studyId,
        label: input.label
      }
    });
  }
}
