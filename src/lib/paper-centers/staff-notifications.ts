import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppBatch, sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { normalizeSriLankaWhatsApp } from "@/lib/validation/sri-lanka-phone";

export type WhatsAppDeliverySummary = {
  whatsappSent: number;
  whatsappSkipped: number;
  whatsappFailed: number;
};

type StaffRecipient = {
  staffId: string;
  paperCenterId: string;
  displayName: string;
  whatsapp: string | null;
};

type PaperCenterMessageType = "manual_paper_center" | "manual_paper_center_broadcast";

export async function loadActivePaperCenterStaff(
  paperCenterId?: string
): Promise<StaffRecipient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("paper_center_staff")
    .select("id, paper_center_id, display_name, whatsapp")
    .eq("active", true);

  if (paperCenterId) {
    query = query.eq("paper_center_id", paperCenterId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    staffId: row.id,
    paperCenterId: row.paper_center_id,
    displayName: row.display_name,
    whatsapp: row.whatsapp,
  }));
}

export async function countActivePaperCenterStaff(paperCenterId?: string): Promise<number> {
  const recipients = await loadActivePaperCenterStaff(paperCenterId);
  return recipients.length;
}

async function logStaffWhatsAppAttempt(input: {
  paperCenterId: string;
  paperCenterStaffId: string;
  phone: string;
  messageType: PaperCenterMessageType;
  title: string;
  body: string;
  status: "pending" | "sent" | "failed" | "skipped";
  providerMessageId?: string;
  error?: string;
  sentBy?: string | null;
}) {
  const supabase = await createClient();
  await supabase.from("batch_whatsapp_log").insert({
    paper_center_id: input.paperCenterId,
    paper_center_staff_id: input.paperCenterStaffId,
    phone: input.phone,
    message_type: input.messageType,
    message_title: input.title,
    message_body: input.body,
    status: input.status,
    provider_message_id: input.providerMessageId ?? null,
    error: input.error ?? null,
    sent_by: input.sentBy ?? null,
  });
}

export async function sendPaperCenterStaffWhatsApp(input: {
  paperCenterId?: string;
  title: string;
  body: string;
  sentBy: string;
}): Promise<WhatsAppDeliverySummary> {
  const recipients = await loadActivePaperCenterStaff(input.paperCenterId);
  const messageType: PaperCenterMessageType = input.paperCenterId
    ? "manual_paper_center"
    : "manual_paper_center_broadcast";

  const summary: WhatsAppDeliverySummary = {
    whatsappSent: 0,
    whatsappSkipped: 0,
    whatsappFailed: 0,
  };

  await sendWhatsAppBatch(recipients, async (recipient) => {
    const phone = recipient.whatsapp ?? "";
    const normalized = phone ? normalizeSriLankaWhatsApp(phone) : null;

    if (!normalized) {
      summary.whatsappSkipped += 1;
      await logStaffWhatsAppAttempt({
        paperCenterId: recipient.paperCenterId,
        paperCenterStaffId: recipient.staffId,
        phone: phone || "",
        messageType,
        title: input.title,
        body: input.body,
        status: "skipped",
        error: "No valid WhatsApp number",
        sentBy: input.sentBy,
      });
      return;
    }

    const result = await sendWhatsAppTemplate({
      to: normalized,
      template: "announcement",
      variables: {
        title: input.title,
        body: input.body,
        studentName: recipient.displayName,
      },
    });

    if (result.ok) {
      summary.whatsappSent += 1;
      await logStaffWhatsAppAttempt({
        paperCenterId: recipient.paperCenterId,
        paperCenterStaffId: recipient.staffId,
        phone: normalized,
        messageType,
        title: input.title,
        body: input.body,
        status: "sent",
        providerMessageId: result.messageId,
        sentBy: input.sentBy,
      });
    } else if (result.skipped) {
      summary.whatsappSkipped += 1;
      await logStaffWhatsAppAttempt({
        paperCenterId: recipient.paperCenterId,
        paperCenterStaffId: recipient.staffId,
        phone: normalized,
        messageType,
        title: input.title,
        body: input.body,
        status: "skipped",
        error: result.error,
        sentBy: input.sentBy,
      });
    } else {
      summary.whatsappFailed += 1;
      await logStaffWhatsAppAttempt({
        paperCenterId: recipient.paperCenterId,
        paperCenterStaffId: recipient.staffId,
        phone: normalized,
        messageType,
        title: input.title,
        body: input.body,
        status: "failed",
        error: result.error,
        sentBy: input.sentBy,
      });
    }
  });

  return summary;
}
