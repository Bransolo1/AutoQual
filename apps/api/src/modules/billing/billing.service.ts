import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private assertStripe() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new ServiceUnavailableException(
        "Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing.",
      );
    }
  }

  private async getStripe() {
    this.assertStripe();
    // Lazy import so the app boots without stripe installed
    const Stripe = (await import("stripe")).default;
    return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" as Parameters<typeof Stripe>[1]["apiVersion"] });
  }

  async createCheckoutSession(workspaceId: string, returnOrigin: string) {
    const stripe = await this.getStripe();
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      throw new ServiceUnavailableException("STRIPE_PRICE_ID is not configured.");
    }

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { stripeCustomerId: true, name: true },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: workspaceId,
      customer: workspace.stripeCustomerId ?? undefined,
      success_url: `${returnOrigin}/settings/billing?success=1`,
      cancel_url: `${returnOrigin}/settings/billing?cancelled=1`,
      metadata: { workspaceId },
    });

    return { url: session.url };
  }

  async createPortalSession(workspaceId: string, returnOrigin: string) {
    const stripe = await this.getStripe();
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { stripeCustomerId: true },
    });
    if (!workspace.stripeCustomerId) {
      throw new ServiceUnavailableException("No Stripe customer linked to this workspace.");
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${returnOrigin}/settings/billing`,
    });
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, sig: string) {
    const stripe = await this.getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new ServiceUnavailableException("STRIPE_WEBHOOK_SECRET not set");

    let event: import("stripe").Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${String(err)}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId ?? session.client_reference_id;
        if (workspaceId) {
          await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: {
              billingStatus: "active",
              stripeCustomerId: session.customer as string | undefined,
              stripeSubscriptionId: session.subscription as string | undefined,
            },
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as import("stripe").Stripe.Invoice;
        const subId = invoice.subscription as string | undefined;
        if (subId) {
          await this.prisma.workspace.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { billingStatus: "past_due" },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        await this.prisma.workspace.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { billingStatus: "cancelled", stripeSubscriptionId: null },
        });
        break;
      }
    }

    return { received: true };
  }
}
