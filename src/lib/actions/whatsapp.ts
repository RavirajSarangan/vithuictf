import { getAppUrl } from "@/lib/email/resend";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/cloud-api";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";
import {
  buildWelcomeStudentTemplateComponents,
  type WelcomeStudentWhatsAppData,
} from "@/lib/whatsapp/templates/welcome-student";
import {
  buildProfilePhotoTemplateComponents,
  type ProfilePhotoWhatsAppData,
} from "@/lib/whatsapp/templates/profile-photo";

// Internal helpers — not server actions. Import only from trusted server action modules.

export async function sendStudentWelcomeWhatsApp(
  data: Omit<WelcomeStudentWhatsAppData, "loginUrl"> & { phone: string; loginUrl?: string }
): Promise<{ whatsappSent: boolean; error?: string }> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { whatsappSent: false, error: "WhatsApp not configured" };
  }

  const loginUrl = data.loginUrl ?? `${getAppUrl()}/login`;
  const payload: WelcomeStudentWhatsAppData = {
    displayName: data.displayName,
    studentId: data.studentId,
    courseName: data.courseName,
    loginUrl,
    username: data.username,
    indexNumber: data.indexNumber,
    selfRegistered: data.selfRegistered,
  };

  const result = await sendWhatsAppTemplate({
    to: data.phone,
    templateName: config.welcomeTemplate,
    components: buildWelcomeStudentTemplateComponents(payload),
  });

  return { whatsappSent: result.whatsappSent, error: result.error };
}

export async function sendProfilePhotoWhatsApp(
  data: ProfilePhotoWhatsAppData & { phone: string }
): Promise<{ whatsappSent: boolean; error?: string }> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { whatsappSent: false, error: "WhatsApp not configured" };
  }

  const result = await sendWhatsAppTemplate({
    to: data.phone,
    templateName: config.profileTemplate,
    components: buildProfilePhotoTemplateComponents({
      displayName: data.displayName,
      cardUrl: data.cardUrl,
    }),
  });

  return { whatsappSent: result.whatsappSent, error: result.error };
}
