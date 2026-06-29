import type { WhatsAppTemplateComponent } from "@/lib/whatsapp/cloud-api";

export interface ProfilePhotoWhatsAppData {
  displayName: string;
  cardUrl: string;
}

export function buildProfilePhotoTemplateComponents(
  data: ProfilePhotoWhatsAppData
): WhatsAppTemplateComponent[] {
  return [
    {
      type: "body",
      parameters: [
        { type: "text", text: data.displayName },
        { type: "text", text: data.cardUrl },
      ],
    },
  ];
}

/**
 * Expected Meta template `ictf_profile_photo_updated` body (en):
 * Hi {{1}}, your ICTF profile photo was updated. View your card: {{2}}
 */
