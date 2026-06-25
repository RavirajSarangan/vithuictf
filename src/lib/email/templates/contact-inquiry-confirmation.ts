import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";
import { buildIctfEmailLayout } from "@/lib/email/layout";

export type ContactInquiryConfirmationEmailData = {
  name: string;
  message: string;
};

export function buildContactInquiryConfirmationEmailHtml(
  data: ContactInquiryConfirmationEmailData
): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello <strong>${escapeHtml(data.name)}</strong>,</p>
    <p style="margin:0 0 16px;">Thank you for contacting <strong>${escapeHtml(BRAND.fullName)} (${escapeHtml(BRAND.name)})</strong>. We have received your message and our team will get back to you soon.</p>
    <p style="margin:0 0 8px;font-size:14px;color:${BRAND.colors.textLight};">For urgent enrollment support, you can also reach us at ${escapeHtml(BRAND.contact.phone)} or ${escapeHtml(BRAND.contact.email)}.</p>
  `;

  return buildIctfEmailLayout({
    title: "We received your message",
    subtitle: "Our team will respond shortly",
    preheader: "Thanks for contacting ICTF — we received your inquiry.",
    bodyHtml,
    cta: {
      label: "Visit ICTF website",
      href: "https://ictf.lk",
    },
  });
}

export function buildContactInquiryConfirmationEmailSubject(): string {
  return `We received your message — ${BRAND.name}`;
}
