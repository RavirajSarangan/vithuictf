import { BRAND } from "@/lib/constants";
import type { WhatsAppTemplateComponent } from "@/lib/whatsapp/cloud-api";

export interface WelcomeStudentWhatsAppData {
  displayName: string;
  studentId: string;
  courseName: string;
  loginUrl: string;
  username?: string;
  indexNumber?: string;
  selfRegistered?: boolean;
}

function formatPortalId(data: WelcomeStudentWhatsAppData): string {
  if (data.indexNumber) return `Index: ${data.indexNumber}`;
  if (data.username) return `Username: ${data.username}`;
  return `Login email on file`;
}

export function buildWelcomeStudentTemplateComponents(
  data: WelcomeStudentWhatsAppData
): WhatsAppTemplateComponent[] {
  const passwordNote = data.selfRegistered
    ? "Use the password you set during registration."
    : `Your temporary password was sent to your email.`;

  return [
    {
      type: "body",
      parameters: [
        { type: "text", text: data.displayName },
        { type: "text", text: data.studentId },
        { type: "text", text: data.courseName },
        { type: "text", text: formatPortalId(data) },
        { type: "text", text: passwordNote },
        { type: "text", text: data.loginUrl },
        { type: "text", text: BRAND.contact.email },
      ],
    },
  ];
}

/**
 * Expected Meta template `ictf_student_welcome` body (en):
 * Hello {{1}}, welcome to ICTF! Student ID: {{2}}. Course: {{3}}. {{4}}. {{5}} Login: {{6}}. Support: {{7}}
 */
