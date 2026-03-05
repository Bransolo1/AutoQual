import { Body, Controller, Get, Param, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../../auth/public.decorator";
import {
  CreateEmbedTokenInput,
  EmbedConsentInput,
  EmbedCompletionInput,
  EmbedSessionInput,
  EmbedTranscriptInput,
  EmbedTurnInput,
} from "./embed.dto";
import { EmbedService } from "./embed.service";

@Controller("embed")
export class EmbedController {
  constructor(private readonly embedService: EmbedService) {}

  @Post("token")
  createToken(@Body() input: CreateEmbedTokenInput) {
    return {
      token: this.embedService.createToken(input.studyId, input.expiresInMinutes),
    };
  }

  @Public()
  @Get(":token")
  serveEmbed(@Param("token") token: string, @Res() res: Response) {
    const payload = this.embedService.verifyToken(token);
    const webBaseUrl = process.env.WEB_BASE_URL ?? "http://localhost:3000";
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpenQual Interview</title>
  </head>
  <body style="margin:0;font-family:Inter,system-ui,sans-serif;background:#f8f6f3;">
    <div style="padding:24px;">
      <h2 style="margin:0 0 8px;">OpenQual Interview</h2>
      <p style="margin:0 0 12px;color:#475569;">Study: ${payload.studyId}</p>
      <iframe
        title="OpenQual Participant"
        src="${webBaseUrl}/participant?token=${token}&studyId=${payload.studyId}"
        style="width:100%;height:640px;border:1px solid #e2e8f0;border-radius:16px;background:white;"
      ></iframe>
      <p id="embed-status" style="margin-top:12px;color:#64748b;font-size:12px;">
        Waiting for completion...
      </p>
    </div>
    <script>
      window.addEventListener("message", (event) => {
        if (event && event.data && event.data.type === "openqual.embed.completed") {
          const el = document.getElementById("embed-status");
          if (el) el.textContent = "Completion received. Thank you!";
        }
      });
    </script>
  </body>
</html>`;
    res.type("html").send(html);
  }

  @Public()
  @Post(":token/complete")
  async complete(@Param("token") token: string, @Body() input: EmbedCompletionInput) {
    const payload = this.embedService.verifyToken(token);
    return this.embedService.notifyCompletion(payload.studyId, input);
  }

  @Public()
  @Post(":token/session")
  async createSession(@Param("token") token: string, @Body() input: EmbedSessionInput) {
    const payload = this.embedService.verifyToken(token);
    return this.embedService.createSession(payload.studyId, input);
  }

  @Public()
  @Post(":token/turn")
  async recordTurn(@Param("token") token: string, @Body() input: EmbedTurnInput) {
    this.embedService.verifyToken(token);
    return this.embedService.recordTurn(input);
  }

  @Public()
  @Post(":token/transcript")
  async createTranscript(@Param("token") token: string, @Body() input: EmbedTranscriptInput) {
    this.embedService.verifyToken(token);
    return this.embedService.createTranscript(input);
  }

  @Public()
  @Post(":token/consent")
  async updateConsent(@Param("token") token: string, @Body() input: EmbedConsentInput) {
    this.embedService.verifyToken(token);
    return this.embedService.updateConsent(input);
  }
}
