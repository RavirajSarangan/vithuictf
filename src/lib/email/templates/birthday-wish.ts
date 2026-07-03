import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";
import { buildIctfEmailLayout } from "@/lib/email/layout";

export interface BirthdayWishEmailData {
  name: string;
  role: string;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim();
}

export function buildBirthdayWishEmailSubject(data: BirthdayWishEmailData): string {
  return `Happy Birthday, ${firstName(data.name)}! 🎂 — from the ${BRAND.name} family`;
}

export function buildBirthdayWishEmailHtml(data: BirthdayWishEmailData): string {
  const accent = BRAND.colors.accent;
  const navy = BRAND.colors.navy;
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Dear ${escapeHtml(data.name)},</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;border-spacing:0;">
      <tr>
        <td align="center" style="padding:24px 22px;border:2px solid ${accent};border-radius:16px;background:linear-gradient(180deg,#fff9ed 0%,#ffffff 100%);">
          <p style="margin:0 0 6px;font-size:30px;line-height:1;">🎉🎂🎈</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:${navy};">Happy Birthday!</p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${BRAND.colors.textLight};">Wishing you a day filled with joy, laughter, and celebration.</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">On behalf of everyone at ${escapeHtml(BRAND.fullName)}, we wish you a wonderful birthday and a fantastic year ahead.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Thank you for everything you do as our <strong style="color:${navy};">${escapeHtml(data.role)}</strong> — your dedication helps shape the future of ICT education across Sri Lanka.</p>
    <p style="margin:0;font-size:15px;line-height:1.7;">Enjoy your special day! 🥳<br /><strong style="color:${navy};">The ${escapeHtml(BRAND.name)} Team</strong></p>
  `;

  return buildIctfEmailLayout({
    title: `Happy Birthday, ${firstName(data.name)}! 🎉`,
    subtitle: "A special wish from the ICTF family",
    preheader: `Happy Birthday from everyone at ${BRAND.name}!`,
    bodyHtml,
    cta: { label: "Visit ictf.lk", href: "https://ictf.lk" },
  });
}

export function buildBirthdayWishEmailText(data: BirthdayWishEmailData): string {
  return [
    `Dear ${data.name},`,
    "",
    `Happy Birthday from everyone at ${BRAND.fullName}!`,
    "",
    "Wishing you a day filled with joy, laughter, and celebration, and a fantastic year ahead.",
    "",
    `Thank you for everything you do as our ${data.role} — your dedication helps shape the future of ICT education across Sri Lanka.`,
    "",
    "Enjoy your special day!",
    `The ${BRAND.name} Team`,
    "https://ictf.lk",
  ].join("\n");
}
