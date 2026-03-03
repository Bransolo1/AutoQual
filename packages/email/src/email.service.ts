/**
 * Thin email-sending abstraction. Supports:
 *   - SMTP via nodemailer (EMAIL_PROVIDER=smtp)
 *   - AWS SES via nodemailer-ses-transport (EMAIL_PROVIDER=ses)
 *   - Resend (EMAIL_PROVIDER=resend)
 *   - Console log fallback for local dev / CI (EMAIL_PROVIDER=console, default)
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}

// ---------------------------------------------------------------------------
// Console provider (default / local dev)
// ---------------------------------------------------------------------------
class ConsoleProvider implements EmailProvider {
  async send(options: SendEmailOptions): Promise<void> {
    console.log("[email:console]", {
      to: options.to,
      subject: options.subject,
      preview: options.text?.slice(0, 120) ?? options.html.slice(0, 120),
    });
  }
}

// ---------------------------------------------------------------------------
// SMTP provider (nodemailer)
// ---------------------------------------------------------------------------
class SmtpProvider implements EmailProvider {
  private transport: import("nodemailer").Transporter | null = null;

  private async getTransport() {
    if (this.transport) return this.transport;
    const nodemailer = await import("nodemailer");
    this.transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "localhost",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    return this.transport;
  }

  async send(options: SendEmailOptions): Promise<void> {
    const transport = await this.getTransport();
    await transport.sendMail({
      from: options.from ?? process.env.EMAIL_FROM ?? "noreply@sensehub.app",
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}

// ---------------------------------------------------------------------------
// Resend provider
// ---------------------------------------------------------------------------
class ResendProvider implements EmailProvider {
  async send(options: SendEmailOptions): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is required for Resend email provider");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: options.from ?? process.env.EMAIL_FROM ?? "noreply@sensehub.app",
        to: Array.isArray(options.to) ? options.to : [options.to],
        reply_to: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error ${res.status}: ${body}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
function createProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  switch (provider) {
    case "smtp":
      return new SmtpProvider();
    case "ses":
      // SES uses the SMTP interface with AWS SES SMTP credentials
      return new SmtpProvider();
    case "resend":
      return new ResendProvider();
    default:
      return new ConsoleProvider();
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export class EmailService {
  private readonly provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider ?? createProvider();
  }

  async send(options: SendEmailOptions): Promise<void> {
    try {
      await this.provider.send(options);
    } catch (err) {
      // Never let email failures crash the caller; log and continue.
      console.error("[EmailService] Failed to send email:", err);
    }
  }
}
