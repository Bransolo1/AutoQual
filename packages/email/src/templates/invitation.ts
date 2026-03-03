export interface InvitationEmailData {
  inviteeName?: string;
  workspaceName: string;
  inviterName?: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
}

export function invitationEmail(data: InvitationEmailData): { subject: string; html: string; text: string } {
  const greeting = data.inviteeName ? `Hi ${data.inviteeName},` : "Hi,";
  const inviterLine = data.inviterName
    ? `${data.inviterName} has invited you`
    : "You have been invited";
  const expiresFormatted = data.expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = `You're invited to join ${data.workspaceName} on Sensehub`;

  const text = [
    greeting,
    "",
    `${inviterLine} to join ${data.workspaceName} as a ${data.role}.`,
    "",
    `Accept your invitation: ${data.acceptUrl}`,
    "",
    `This link expires on ${expiresFormatted}.`,
    "",
    "If you did not expect this invitation, you can safely ignore this email.",
    "",
    "— The Sensehub team",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;font-size:20px;font-weight:600;color:#0f172a;">Sensehub</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px;font-size:15px;color:#334155;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;">
                ${inviterLine} to join <strong>${escapeHtml(data.workspaceName)}</strong>
                as a <strong>${escapeHtml(data.role)}</strong>.
              </p>
              <a href="${data.acceptUrl}"
                 style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                Accept invitation
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
                This link expires on ${escapeHtml(expiresFormatted)}. If you did not expect this
                invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} Sensehub &nbsp;·&nbsp;
                <a href="https://sensehub.app/legal/privacy" style="color:#94a3b8;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
