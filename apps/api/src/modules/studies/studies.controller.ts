import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { StudiesService } from "./studies.service";
import {
  CreateStudyInput,
  UpdateLocalizationChecklistInput,
  UpdateRecruitmentChecklistInput,
  UpdateActivationChecklistInput,
  UpdateRolloutPlanInput,
  UpdateDistributionTrackingInput,
  UpdateDeliveryHealthInput,
  UpdateQuotaTargetsInput,
  UpdateInterviewGuideInput,
} from "./studies.dto";

@Controller("studies")
export class StudiesController {
  constructor(private readonly studiesService: StudiesService) {}

  @Get()
  list(@Query("workspaceId") workspaceId: string) {
    return this.studiesService.list(workspaceId);
  }

  @Post()
  create(@Body() input: CreateStudyInput) {
    return this.studiesService.create(input);
  }

  @Post(":id/build")
  buildFromBrief(@Param("id") id: string, @Body("brief") brief: string) {
    return this.studiesService.buildFromBrief(id, brief ?? "");
  }

  @Post(":id/screening")
  updateScreening(
    @Param("id") id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.studiesService.updateScreeningLogic(id, body ?? {});
  }

  @Post(":id/guide")
  updateGuide(
    @Param("id") id: string,
    @Body() input: UpdateInterviewGuideInput,
  ) {
    return this.studiesService.updateInterviewGuide(id, input.guide ?? {});
  }

  @Post(":id/synthetic-answer")
  syntheticAnswer(
    @Param("id") id: string,
    @Body("prompt") prompt: string
  ) {
    return this.studiesService.syntheticAnswer(id, prompt ?? "");
  }

  @Post(":id/localization")
  updateLocalization(
    @Param("id") id: string,
    @Body() input: UpdateLocalizationChecklistInput,
  ) {
    return this.studiesService.updateLocalizationChecklist(id, input.checklist ?? {});
  }

  @Post(":id/recruitment")
  updateRecruitment(
    @Param("id") id: string,
    @Body() input: UpdateRecruitmentChecklistInput,
  ) {
    return this.studiesService.updateRecruitmentChecklist(id, input.checklist ?? {});
  }

  @Post(":id/quotas")
  updateQuotas(
    @Param("id") id: string,
    @Body() input: UpdateQuotaTargetsInput,
  ) {
    return this.studiesService.updateQuotaTargets(id, input.quotaTargets ?? {});
  }

  @Post(":id/activation")
  updateActivation(
    @Param("id") id: string,
    @Body() input: UpdateActivationChecklistInput,
  ) {
    return this.studiesService.updateActivationChecklist(id, input.checklist ?? {});
  }

  @Post(":id/rollout")
  updateRollout(
    @Param("id") id: string,
    @Body() input: UpdateRolloutPlanInput,
  ) {
    return this.studiesService.updateRolloutPlan(id, input.rolloutPlan ?? { markets: [] });
  }

  @Post(":id/distribution")
  updateDistribution(
    @Param("id") id: string,
    @Body() input: UpdateDistributionTrackingInput,
  ) {
    return this.studiesService.updateDistributionTracking(id, input.distributionTracking ?? { channels: [] });
  }

  @Post(":id/delivery-health")
  updateDeliveryHealth(
    @Param("id") id: string,
    @Body() input: UpdateDeliveryHealthInput,
  ) {
    return this.studiesService.updateDeliveryHealth(id, input.deliveryHealth ?? { score: 0, status: "unknown" });
  }

  @Get(":id/segment-summary")
  segmentSummary(@Param("id") id: string) {
    return this.studiesService.segmentSummary(id);
  }

  @Get(":id/quota-status")
  quotaStatus(@Param("id") id: string) {
    return this.studiesService.quotaStatus(id);
  }
}
