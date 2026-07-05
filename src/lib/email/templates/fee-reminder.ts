import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";
import { buildIctfEmailLayout } from "@/lib/email/layout";

export interface FeeReminderEmailData {
  name: string;
  outstandingLkr: number;
  courses: { courseName: string; outstandingLkr: number }[];
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim();
}

function formatLkr(amount: number): string {
  return `Rs. ${amount.toLocaleString()}`;
}

export function buildFeeReminderEmailSubject(data: FeeReminderEmailData): string {
  return `Class fee reminder — ${formatLkr(data.outstandingLkr)} outstanding`;
}

export function buildFeeReminderEmailHtml(data: FeeReminderEmailData): string {
  const navy = BRAND.colors.navy;
  const accent = BRAND.colors.accent;
  const courseRows = data.courses
    .map(
      (course) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eef0f4;font-size:14px;color:${navy};">${escapeHtml(course.courseName)}</td>
        <td align="right" style="padding:10px 14px;border-bottom:1px solid #eef0f4;font-size:14px;font-weight:700;color:${navy};">${formatLkr(course.outstandingLkr)}</td>
      </tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Dear ${escapeHtml(data.name)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">This is a friendly reminder that you have outstanding class fees with ${escapeHtml(BRAND.fullName)}.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;border-spacing:0;border:2px solid ${accent};border-radius:14px;overflow:hidden;">
      <tr>
        <td colspan="2" align="center" style="padding:18px 14px;background:linear-gradient(180deg,#fff9ed 0%,#ffffff 100%);">
          <p style="margin:0;font-size:13px;color:${BRAND.colors.textLight};">Total outstanding</p>
          <p style="margin:4px 0 0;font-size:26px;font-weight:800;color:${navy};">${formatLkr(data.outstandingLkr)}</p>
        </td>
      </tr>
      ${courseRows}
    </table>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">You can review the full breakdown of your class fees on the Payments page of your student portal. Please settle the balance at your next class or contact us if you have any questions.</p>
    <p style="margin:0;font-size:15px;line-height:1.7;">Thank you,<br /><strong style="color:${navy};">The ${escapeHtml(BRAND.name)} Team</strong></p>
  `;

  return buildIctfEmailLayout({
    title: "Class fee reminder",
    subtitle: `${formatLkr(data.outstandingLkr)} outstanding`,
    preheader: `You have ${formatLkr(data.outstandingLkr)} in outstanding class fees.`,
    bodyHtml,
    cta: { label: "View payments", href: "https://www.ictf.lk/payments" },
  });
}

export function buildFeeReminderEmailText(data: FeeReminderEmailData): string {
  return [
    `Dear ${firstName(data.name)},`,
    "",
    `This is a friendly reminder that you have ${formatLkr(data.outstandingLkr)} in outstanding class fees with ${BRAND.fullName}.`,
    "",
    ...data.courses.map((course) => `- ${course.courseName}: ${formatLkr(course.outstandingLkr)}`),
    "",
    "You can review the full breakdown on the Payments page of your student portal: https://www.ictf.lk/payments",
    "",
    "Thank you,",
    `The ${BRAND.name} Team`,
  ].join("\n");
}
