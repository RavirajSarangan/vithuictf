import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { sendWhatsAppBatch, sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { normalizeSriLankaWhatsApp } from "@/lib/validation/sri-lanka-phone";

export type MessageChannels = {
  sendPortal: boolean;
  sendWhatsApp: boolean;
};

export type DeliverySummary = {
  portalSent: number;
  whatsappSent: number;
  whatsappSkipped: number;
  whatsappFailed: number;
};

type StudentRecipient = {
  studentId: string;
  userId: string;
  displayName: string;
  phone: string | null;
  notifyWhatsapp: boolean;
};

async function loadBatchStudents(batchId: string): Promise<StudentRecipient[]> {
  const supabase = await createClient();
  const { data: enrollments } = await supabase
    .from("batch_enrollments")
    .select("student_id, students(id, user_id, display_name, phone, notify_whatsapp)")
    .eq("batch_id", batchId)
    .eq("active", true);

  const recipients: StudentRecipient[] = [];
  for (const row of enrollments ?? []) {
    const studentRaw = row.students as unknown;
    const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as {
      id: string;
      user_id: string;
      display_name: string;
      phone: string | null;
      notify_whatsapp: boolean;
    } | null;
    if (!student?.user_id) continue;
    recipients.push({
      studentId: student.id,
      userId: student.user_id,
      displayName: student.display_name,
      phone: student.phone,
      notifyWhatsapp: student.notify_whatsapp !== false,
    });
  }
  return recipients;
}

async function loadAllActiveStudents(): Promise<StudentRecipient[]> {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, user_id, display_name, phone, notify_whatsapp")
    .eq("active", true);

  return (students ?? [])
    .filter((s) => s.user_id)
    .map((s) => ({
      studentId: s.id,
      userId: s.user_id,
      displayName: s.display_name,
      phone: s.phone,
      notifyWhatsapp: s.notify_whatsapp !== false,
    }));
}

async function insertPortalNotifications(
  recipients: StudentRecipient[],
  title: string,
  body: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  if (!recipients.length) return 0;

  const rows = recipients.map((r) => ({
    user_id: r.userId,
    title,
    body,
    type: "class" as const,
    metadata: metadata ?? null,
  }));

  const supabase = isAdminClientConfigured() ? createAdminClient() : await createClient();
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

async function logWhatsAppAttempt(input: {
  batchId?: string | null;
  sessionId?: string | null;
  studentId: string;
  phone: string;
  messageType:
    | "last_class"
    | "last_class_eve"
    | "manual_batch"
    | "manual_broadcast"
    | "class_cancel"
    | "class_reminder";
  title: string;
  body: string;
  status: "pending" | "sent" | "failed" | "skipped";
  providerMessageId?: string;
  error?: string;
  sentBy?: string | null;
}) {
  const supabase = await createClient();
  await supabase.from("batch_whatsapp_log").insert({
    batch_id: input.batchId ?? null,
    session_id: input.sessionId ?? null,
    student_id: input.studentId,
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

export async function notifyBatchStudentsPortal(
  batchId: string,
  title: string,
  body: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  const recipients = await loadBatchStudents(batchId);
  return insertPortalNotifications(recipients, title, body, metadata);
}

export async function sendBatchManualMessage(
  batchId: string,
  input: {
    title: string;
    body: string;
    channels: MessageChannels;
    sentBy: string;
  }
): Promise<DeliverySummary> {
  const recipients = await loadBatchStudents(batchId);
  const summary: DeliverySummary = {
    portalSent: 0,
    whatsappSent: 0,
    whatsappSkipped: 0,
    whatsappFailed: 0,
  };

  if (input.channels.sendPortal) {
    summary.portalSent = await insertPortalNotifications(recipients, input.title, input.body, {
      batchId,
      kind: "manual_batch",
    });
  }

  if (input.channels.sendWhatsApp) {
    await sendWhatsAppBatch(recipients, async (recipient) => {
      const phone = recipient.phone ?? "";
      const normalized = phone ? normalizeSriLankaWhatsApp(phone) : null;

      if (!recipient.notifyWhatsapp || !normalized) {
        summary.whatsappSkipped += 1;
        await logWhatsAppAttempt({
          batchId,
          studentId: recipient.studentId,
          phone: phone || "",
          messageType: "manual_batch",
          title: input.title,
          body: input.body,
          status: "skipped",
          error: !normalized ? "No valid phone" : "WhatsApp opt-out",
          sentBy: input.sentBy,
        });
        return;
      }

      const result = await sendWhatsAppTemplate({
        to: normalized,
        template: "announcement",
        variables: { title: input.title, body: input.body, studentName: recipient.displayName },
      });

      if (result.ok) {
        summary.whatsappSent += 1;
        await logWhatsAppAttempt({
          batchId,
          studentId: recipient.studentId,
          phone: normalized,
          messageType: "manual_batch",
          title: input.title,
          body: input.body,
          status: "sent",
          providerMessageId: result.messageId,
          sentBy: input.sentBy,
        });
      } else if (result.skipped) {
        summary.whatsappSkipped += 1;
        await logWhatsAppAttempt({
          batchId,
          studentId: recipient.studentId,
          phone: normalized,
          messageType: "manual_batch",
          title: input.title,
          body: input.body,
          status: "skipped",
          error: result.error,
          sentBy: input.sentBy,
        });
      } else {
        summary.whatsappFailed += 1;
        await logWhatsAppAttempt({
          batchId,
          studentId: recipient.studentId,
          phone: normalized,
          messageType: "manual_batch",
          title: input.title,
          body: input.body,
          status: "failed",
          error: result.error,
          sentBy: input.sentBy,
        });
      }
    });
  }

  return summary;
}

export async function broadcastStudentMessage(
  input: {
    title: string;
    body: string;
    channels: MessageChannels;
    sentBy: string;
  }
): Promise<DeliverySummary> {
  const recipients = await loadAllActiveStudents();
  const summary: DeliverySummary = {
    portalSent: 0,
    whatsappSent: 0,
    whatsappSkipped: 0,
    whatsappFailed: 0,
  };

  if (input.channels.sendPortal) {
    summary.portalSent = await insertPortalNotifications(recipients, input.title, input.body, {
      kind: "manual_broadcast",
    });
  }

  if (input.channels.sendWhatsApp) {
    await sendWhatsAppBatch(recipients, async (recipient) => {
      const phone = recipient.phone ?? "";
      const normalized = phone ? normalizeSriLankaWhatsApp(phone) : null;

      if (!recipient.notifyWhatsapp || !normalized) {
        summary.whatsappSkipped += 1;
        await logWhatsAppAttempt({
          studentId: recipient.studentId,
          phone: phone || "",
          messageType: "manual_broadcast",
          title: input.title,
          body: input.body,
          status: "skipped",
          error: !normalized ? "No valid phone" : "WhatsApp opt-out",
          sentBy: input.sentBy,
        });
        return;
      }

      const result = await sendWhatsAppTemplate({
        to: normalized,
        template: "announcement",
        variables: { title: input.title, body: input.body, studentName: recipient.displayName },
      });

      if (result.ok) {
        summary.whatsappSent += 1;
        await logWhatsAppAttempt({
          studentId: recipient.studentId,
          phone: normalized,
          messageType: "manual_broadcast",
          title: input.title,
          body: input.body,
          status: "sent",
          providerMessageId: result.messageId,
          sentBy: input.sentBy,
        });
      } else if (result.skipped) {
        summary.whatsappSkipped += 1;
      } else {
        summary.whatsappFailed += 1;
        await logWhatsAppAttempt({
          studentId: recipient.studentId,
          phone: normalized,
          messageType: "manual_broadcast",
          title: input.title,
          body: input.body,
          status: "failed",
          error: result.error,
          sentBy: input.sentBy,
        });
      }
    });
  }

  return summary;
}

export async function notifyBatchStudentsWhatsAppLastClass(input: {
  batchId: string;
  sessionId: string;
  batchName: string;
  classDate: string;
  classTime: string;
  zoomLink?: string | null;
}): Promise<DeliverySummary> {
  const recipients = await loadBatchStudents(input.batchId);
  const title = `Final class today — ${input.batchName}`;
  const body = `Your last class is today (${input.classDate}) at ${input.classTime.slice(0, 5)}.${
    input.zoomLink ? ` Zoom: ${input.zoomLink}` : ""
  }`;

  const summary: DeliverySummary = {
    portalSent: await insertPortalNotifications(recipients, title, body, {
      batchId: input.batchId,
      sessionId: input.sessionId,
      kind: "last_class",
    }),
    whatsappSent: 0,
    whatsappSkipped: 0,
    whatsappFailed: 0,
  };

  await sendWhatsAppBatch(recipients, async (recipient) => {
    const normalized = recipient.phone ? normalizeSriLankaWhatsApp(recipient.phone) : null;
    if (!recipient.notifyWhatsapp || !normalized) {
      summary.whatsappSkipped += 1;
      return;
    }

    const result = await sendWhatsAppTemplate({
      to: normalized,
      template: "last_class",
      variables: {
        studentName: recipient.displayName,
        batchName: input.batchName,
        classDate: input.classDate,
        classTime: input.classTime.slice(0, 5),
        zoomLink: input.zoomLink ?? undefined,
      },
    });

    if (result.ok) {
      summary.whatsappSent += 1;
      await logWhatsAppAttempt({
        batchId: input.batchId,
        sessionId: input.sessionId,
        studentId: recipient.studentId,
        phone: normalized,
        messageType: "last_class",
        title,
        body,
        status: "sent",
        providerMessageId: result.messageId,
      });
    } else if (!result.skipped) {
      summary.whatsappFailed += 1;
      await logWhatsAppAttempt({
        batchId: input.batchId,
        sessionId: input.sessionId,
        studentId: recipient.studentId,
        phone: normalized,
        messageType: "last_class",
        title,
        body,
        status: "failed",
        error: result.error,
      });
    } else {
      summary.whatsappSkipped += 1;
    }
  });

  return summary;
}

export async function notifyBatchStudentsPortalOnly(
  batchId: string,
  title: string,
  body: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  return notifyBatchStudentsPortal(batchId, title, body, metadata);
}

export async function notifyAbsentStudents(input: {
  batchId: string;
  sessionId: string;
  batchName: string;
  classDate: string;
  classNumber: number;
  studentIds: string[];
  sentBy?: string | null;
}): Promise<DeliverySummary> {
  if (!input.studentIds.length) {
    return { portalSent: 0, whatsappSent: 0, whatsappSkipped: 0, whatsappFailed: 0 };
  }

  const allRecipients = await loadBatchStudents(input.batchId);
  const idSet = new Set(input.studentIds);
  const recipients = allRecipients.filter((r) => idSet.has(r.studentId));

  const title = `Absent — ${input.batchName}`;
  const body = `You were marked absent for Class ${input.classNumber} on ${input.classDate}. Contact your teacher if this is incorrect.`;

  const summary: DeliverySummary = {
    portalSent: await insertPortalNotifications(recipients, title, body, {
      batchId: input.batchId,
      sessionId: input.sessionId,
      kind: "absent",
    }),
    whatsappSent: 0,
    whatsappSkipped: 0,
    whatsappFailed: 0,
  };

  await sendWhatsAppBatch(recipients, async (recipient) => {
    const normalized = recipient.phone ? normalizeSriLankaWhatsApp(recipient.phone) : null;
    if (!recipient.notifyWhatsapp || !normalized) {
      summary.whatsappSkipped += 1;
      return;
    }

    const result = await sendWhatsAppTemplate({
      to: normalized,
      template: "announcement",
      variables: {
        title,
        body,
        studentName: recipient.displayName,
      },
    });

    if (result.ok) {
      summary.whatsappSent += 1;
      await logWhatsAppAttempt({
        batchId: input.batchId,
        sessionId: input.sessionId,
        studentId: recipient.studentId,
        phone: normalized,
        messageType: "manual_batch",
        title,
        body,
        status: "sent",
        providerMessageId: result.messageId,
        sentBy: input.sentBy,
      });
    } else if (!result.skipped) {
      summary.whatsappFailed += 1;
      await logWhatsAppAttempt({
        batchId: input.batchId,
        sessionId: input.sessionId,
        studentId: recipient.studentId,
        phone: normalized,
        messageType: "manual_batch",
        title,
        body,
        status: "failed",
        error: result.error,
        sentBy: input.sentBy,
      });
    } else {
      summary.whatsappSkipped += 1;
    }
  });

  return summary;
}
