import { Body, Controller, Get, Headers, Post, Query, RawBodyRequest, Req } from "@nestjs/common";
import type { Request } from "express";
import { BillingService } from "./billing.service";
import { Roles } from "../../auth/roles.decorator";
import { Public } from "../../auth/public.decorator";
import { SkipBillingCheck } from "../../auth/skip-billing-check.decorator";
import type { JwtPayload } from "../../auth/auth.guard";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post("checkout-session")
  @Roles("admin")
  createCheckout(
    @Req() req: Request & { user?: JwtPayload },
    @Body() body: { returnOrigin?: string },
  ) {
    const workspaceId = req.user?.workspaceId ?? "";
    const origin = body.returnOrigin ?? process.env.APP_URL ?? "http://localhost:3000";
    return this.billingService.createCheckoutSession(workspaceId, origin);
  }

  @Get("portal")
  @Roles("admin")
  portal(
    @Req() req: Request & { user?: JwtPayload },
    @Query("returnOrigin") returnOrigin?: string,
  ) {
    const workspaceId = req.user?.workspaceId ?? "";
    const origin = returnOrigin ?? process.env.APP_URL ?? "http://localhost:3000";
    return this.billingService.createPortalSession(workspaceId, origin);
  }

  /**
   * Stripe webhook — must receive raw body for signature verification.
   * @Public() + @SkipBillingCheck() so suspended workspaces don't block webhook processing.
   */
  @Post("webhook")
  @Public()
  @SkipBillingCheck()
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") sig: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new Error("Raw body missing — ensure NestJS rawBody is enabled");
    return this.billingService.handleWebhook(rawBody, sig);
  }
}
