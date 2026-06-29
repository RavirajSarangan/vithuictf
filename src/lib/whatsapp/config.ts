import { getAppUrl } from "@/lib/email/resend";

export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
  welcomeTemplate: string;
  profileTemplate: string;
  announcementTemplate: string;
  lastClassTemplate: string;
  appUrl: string;
};

export function isWhatsAppConfigured(): boolean {
  return Boolean(getWhatsAppConfig());
}

export function getWhatsAppConfig(): WhatsAppConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!accessToken || !phoneNumberId) return null;

  const announcementTemplate =
    process.env.WHATSAPP_ANNOUNCEMENT_TEMPLATE?.trim() ||
    process.env.WHATSAPP_TEMPLATE_NAME?.trim() ||
    "ictf_batch_announcement";

  const lastClassTemplate =
    process.env.WHATSAPP_LAST_CLASS_TEMPLATE?.trim() ||
    process.env.WHATSAPP_LAST_CLASS_TEMPLATE_NAME?.trim() ||
    "ictf_batch_last_class";

  return {
    accessToken,
    phoneNumberId,
    apiVersion: process.env.WHATSAPP_API_VERSION?.trim() || "v21.0",
    welcomeTemplate: process.env.WHATSAPP_WELCOME_TEMPLATE?.trim() || "ictf_student_welcome",
    profileTemplate: process.env.WHATSAPP_PROFILE_TEMPLATE?.trim() || "ictf_profile_photo_updated",
    announcementTemplate,
    lastClassTemplate,
    appUrl: getAppUrl(),
  };
}
