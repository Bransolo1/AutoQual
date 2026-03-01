import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { CreateSessionInput } from "./sessions.dto";

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  list(@Query("studyId") studyId: string) {
    return this.sessionsService.list(studyId);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.sessionsService.getById(id);
  }

  @Post()
  create(@Body() input: CreateSessionInput) {
    return this.sessionsService.create(input);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() body: { status: string }) {
    return this.sessionsService.updateStatus(id, body.status);
  }

  @Post(":id/consent")
  captureConsent(@Param("id") id: string) {
    return this.sessionsService.captureConsent(id);
  }
}
