import { getWhatsAppConfig, isWhatsAppConfigured as isConfigured } from "@/lib/whatsapp/config";
import { sendWhatsAppTemplate as sendCloudTemplate } from "@/lib/whatsapp/cloud-api";
import { buildBatchAnnouncementTemplateComponents } from "@/lib/whatsapp/templates/batch-announcement";
import { buildBatchLastClassTemplateComponents } from "@/lib/whatsapp/templates/batch-last-class";

export type WhatsAppTemplateVariables = {
  studentName?: string;
  title?: string;
  body?: string;
  batchName?: string;
  classDate?: string;
  classTime?: string;
  zoomLink?: string;
};

export { isConfigured as isWhatsAppConfigured };

export async function sendWhatsAppTemplate(options: {
  to: string;
  template: "announcement" | "last_class";
  variables: WhatsAppTemplateVariables;
}): Promise<{ ok: boolean; messageId?: string; error?: string; skipped?: boolean }> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { ok: false, skipped: true, error: "WhatsApp API not configured" };
  }

  const templateName =
    options.template === "last_class"
      ? config.lastClassTemplate
      : config.announcementTemplate;

  const components =
    options.template === "last_class"
      ? buildBatchLastClassTemplateComponents({
          studentName: options.variables.studentName ?? "Student",
          batchName: options.variables.batchName ?? "Batch",
          classDate: options.variables.classDate ?? "",
          classTime: options.variables.classTime ?? "",
          zoomLink: options.variables.zoomLink,
        })
      : buildBatchAnnouncementTemplateComponents({
          title: options.variables.title ?? "ICTF",
          body: options.variables.body ?? "",
        });

  const result = await sendCloudTemplate({
    to: options.to,
    templateName,
    components,
  });

  if (result.whatsappSent) {
    return { ok: true, messageId: result.messageId };
  }

  if (result.error === "WhatsApp not configured") {
    return { ok: false, skipped: true, error: result.error };
  }

  return { ok: false, error: result.error };
}

/** Send in small parallel batches to reduce rate-limit risk */
export async function sendWhatsAppBatch<T>(
  items: T[],
  sendOne: (item: T) => Promise<void>,
  concurrency = 10
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    await Promise.all(chunk.map((item) => sendOne(item)));
  }
}
