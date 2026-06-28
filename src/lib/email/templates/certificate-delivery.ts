import { escapeHtml } from "@/lib/email/escape";
import { buildDetailsTable, buildIctfEmailLayout } from "@/lib/email/layout";

export interface CertificateDeliveryEmailData {
  studentName: string;
  courseName: string;
  certificateNumber: string;
  verifyUrl: string;
  downloadUrl?: string;
}

export function buildCertificateDeliveryEmailSubject(certificateNumber: string): string {
  return `Your ICTF Certificate — ${certificateNumber}`;
}

export function buildCertificateDeliveryEmailHtml(data: CertificateDeliveryEmailData): string {
  const rows = [
    { label: "Certificate ID", value: data.certificateNumber },
    { label: "Student", value: data.studentName },
    { label: "Course", value: data.courseName },
    { label: "Verify online", value: data.verifyUrl },
  ];

  const body = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#0F172A;">
      Congratulations, <strong>${escapeHtml(data.studentName)}</strong>!
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
      Your certificate of completion for <strong>${escapeHtml(data.courseName)}</strong> is ready.
      ${data.downloadUrl ? "The certificate image is attached to this email." : "Use the button below to verify your certificate online."}
    </p>
    ${buildDetailsTable(rows)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      Keep your certificate ID safe. Anyone can verify authenticity at the link above.
    </p>
  `;

  return buildIctfEmailLayout({
    preheader: `Certificate ${data.certificateNumber} for ${data.studentName}`,
    title: "Certificate of Completion",
    bodyHtml: body,
    cta: {
      label: "Verify certificate",
      href: data.verifyUrl,
    },
  });
}

export function buildCertificateDeliveryEmailText(data: CertificateDeliveryEmailData): string {
  return [
    `Congratulations, ${data.studentName}!`,
    "",
    `Your certificate for ${data.courseName} is ready.`,
    `Certificate ID: ${data.certificateNumber}`,
    `Verify: ${data.verifyUrl}`,
    data.downloadUrl ? `Download: ${data.downloadUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
