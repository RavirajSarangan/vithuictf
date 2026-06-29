import type { WhatsAppTemplateComponent } from "@/lib/whatsapp/cloud-api";

export interface BatchAnnouncementWhatsAppData {
  title: string;
  body: string;
}

export function buildBatchAnnouncementTemplateComponents(
  data: BatchAnnouncementWhatsAppData
): WhatsAppTemplateComponent[] {
  return [
    {
      type: "body",
      parameters: [
        { type: "text", text: data.title.trim() || "ICTF" },
        { type: "text", text: data.body.trim() },
      ],
    },
  ];
}

/**
 * Expected Meta template `ictf_batch_announcement` body (en):
 *
 * Hello from ICTF.
 *
 * *{{1}}*
 * {{2}}
 *
 * — ICT Foundation
 */
