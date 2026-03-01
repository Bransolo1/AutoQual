import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TrustCenterService } from "./trust-center.service";
import { CreateTrustArtifactInput, UpdateTrustArtifactInput } from "./trust-center.dto";

@Controller("trust-center")
export class TrustCenterController {
  constructor(private readonly trustCenterService: TrustCenterService) {}

  @Get("artifacts")
  list(@Query("workspaceId") workspaceId: string) {
    return this.trustCenterService.list(workspaceId);
  }

  @Post("artifacts")
  create(@Body() input: CreateTrustArtifactInput) {
    return this.trustCenterService.create(input);
  }

  @Patch("artifacts/:id")
  update(@Param("id") id: string, @Body() input: UpdateTrustArtifactInput) {
    return this.trustCenterService.update(id, input);
  }

  @Get("artifacts/:id/signed-url")
  getSignedUrl(@Param("id") id: string) {
    return this.trustCenterService.getSignedUrl(id);
  }

  @Post("upload-url")
  getUploadUrl(@Body() body: { storageKey: string; contentType?: string }) {
    return this.trustCenterService.getUploadUrl(body.storageKey, body.contentType);
  }
}
