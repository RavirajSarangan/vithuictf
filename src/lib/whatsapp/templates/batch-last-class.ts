import type { WhatsAppTemplateComponent } from "@/lib/whatsapp/cloud-api";

export interface BatchLastClassWhatsAppData {
  studentName: string;
  batchName: string;
  classDate: string;
  classTime: string;
  zoomLink?: string | null;
}

export function buildBatchLastClassTemplateComponents(
  data: BatchLastClassWhatsAppData
): WhatsAppTemplateComponent[] {
  return [
    {
      type: "body",
      parameters: [
        { type: "text", text: data.studentName.trim() || "Student" },
        { type: "text", text: data.batchName.trim() || "Batch" },
        { type: "text", text: data.classDate },
        { type: "text", text: data.classTime.slice(0, 5) },
        { type: "text", text: data.zoomLink?.trim() || "N/A" },
      ],
    },
  ];
}

/**
 * Expected Meta template `ictf_batch_last_class` body (en):
 *
 * Hello {{1}}, today is your final class for *{{2}}*.
 *
 * Date: {{3}}
 * Time: {{4}}
 * Zoom: {{5}}
 *
 * — ICT Foundation
 */
