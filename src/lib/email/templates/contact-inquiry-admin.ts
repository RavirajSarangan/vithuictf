import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";
import { buildDetailsTable, buildIctfEmailLayout, buildMessageBox } from "@/lib/email/layout";

export type ContactInquiryAdminEmailData = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  submittedAt?: string;
};

export function buildContactInquiryAdminEmailHtml(data: ContactInquiryAdminEmailData): string {
  const rows = [
    { label: "Name", value: data.name },
    { label: "Email", value: data.email },
    ...(data.phone ? [{ label: "Phone", value: data.phone }] : []),
    ...(data.submittedAt ? [{ label: "Submitted", value: data.submittedAt }] : []),
  ];

  const bodyHtml = `
    <p style="margin:0 0 16px;">A new message was submitted from the <strong>${escapeHtml(BRAND.name)}</strong> website contact form.</p>
    ${buildDetailsTable(rows)}
    <p style="margin:20px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.colors.textLight};">Message</p>
    ${buildMessageBox(data.message)}
    <p style="margin:18px 0 0;font-size:14px;color:${BRAND.colors.textLight};">Reply directly to this email to respond to the sender.</p>
  `;

  return buildIctfEmailLayout({
    title: "New contact inquiry",
    subtitle: "Website contact form",
    preheader: `New inquiry from ${data.name}`,
    bodyHtml,
  });
}

export function buildContactInquiryAdminEmailSubject(name: string): string {
  return `${BRAND.name} contact: ${name}`;
}
