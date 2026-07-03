import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";
import { buildIctfEmailLayout, buildMessageBox } from "@/lib/email/layout";

export interface TeamMessageEmailData {
  name: string;
  subject: string;
  message: string;
}

export function buildTeamMessageEmailSubject(data: TeamMessageEmailData): string {
  return data.subject;
}

export function buildTeamMessageEmailHtml(data: TeamMessageEmailData): string {
  const navy = BRAND.colors.navy;
  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">Dear ${escapeHtml(data.name)},</p>
    ${buildMessageBox(data.message)}
    <p style="margin:20px 0 0;font-size:15px;line-height:1.7;">Best regards,<br /><strong style="color:${navy};">${escapeHtml(BRAND.name)} Admin Team</strong></p>
  `;

  return buildIctfEmailLayout({
    title: data.subject,
    subtitle: `A message from the ${BRAND.name} admin team`,
    preheader: data.subject,
    bodyHtml,
  });
}

export function buildTeamMessageEmailText(data: TeamMessageEmailData): string {
  return [
    `Dear ${data.name},`,
    "",
    data.message,
    "",
    "Best regards,",
    `${BRAND.name} Admin Team`,
  ].join("\n");
}
