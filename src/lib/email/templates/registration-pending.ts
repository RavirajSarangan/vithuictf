import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";
import { buildDetailsTable, buildIctfEmailLayout } from "@/lib/email/layout";

export interface RegistrationPendingEmailData {
  displayName: string;
  studentId: string;
  email: string;
  courseName: string;
}

export function buildRegistrationPendingEmailHtml(data: RegistrationPendingEmailData): string {
  const profileRows = [
    { label: "Full name", value: data.displayName },
    { label: "Login email", value: data.email },
    { label: "Student ID", value: data.studentId },
    { label: "Requested course", value: data.courseName },
  ];

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello <strong>${escapeHtml(data.displayName)}</strong>,</p>
    <p style="margin:0 0 16px;">Thank you for registering with <strong>${escapeHtml(BRAND.fullName)} (${escapeHtml(BRAND.name)})</strong>. We have received your application and our team is reviewing it.</p>
    <p style="margin:0 0 16px;font-size:14px;color:${BRAND.colors.textLight};">Once approved, you will receive a welcome email with full portal access and batch enrollment details. Until then, you can sign in to complete your profile, but most portal features remain locked.</p>

    <p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.colors.textLight};">Your registration details</p>
    ${buildDetailsTable(profileRows)}

    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:${BRAND.colors.textLight};">Questions? Email <a href="mailto:${escapeHtml(BRAND.contact.email)}" style="color:${BRAND.colors.navy};text-decoration:none;font-weight:600;">${escapeHtml(BRAND.contact.email)}</a> or call ${escapeHtml(BRAND.contact.phone)}.</p>
  `;

  return buildIctfEmailLayout({
    title: "Registration received",
    subtitle: "Awaiting approval from our team",
    preheader: `Your ${BRAND.name} registration (${data.studentId}) is under review.`,
    bodyHtml,
    cta: {
      label: "Visit ICTF website",
      href: "https://ictf.lk",
    },
  });
}

export function buildRegistrationPendingEmailSubject(): string {
  return `Registration received — awaiting approval | ${BRAND.name}`;
}

export function buildRegistrationPendingEmailText(data: RegistrationPendingEmailData): string {
  const lines = [
    `Hello ${data.displayName},`,
    "",
    `Thank you for registering with ${BRAND.fullName} (${BRAND.name}). We have received your application and our team is reviewing it.`,
    "",
    "Once approved, you will receive a welcome email with full portal access and batch enrollment details.",
    "",
    "YOUR REGISTRATION DETAILS",
    `Student ID: ${data.studentId}`,
    `Login email: ${data.email}`,
    `Requested course: ${data.courseName}`,
    "",
    `Support: ${BRAND.contact.email} · ${BRAND.contact.phone}`,
  ];

  return lines.join("\n");
}
