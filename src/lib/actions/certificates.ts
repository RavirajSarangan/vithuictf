"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, getSessionProfile } from "@/lib/actions/auth";
import { actionFailure } from "@/lib/actions/action-result";
import { logAdminAction } from "@/lib/audit";
import { allocateCertificateNumber } from "@/lib/certificates/numbering";
import {
  DEFAULT_CERTIFICATE_FIELD_CONFIG,
  DEFAULT_CERTIFICATE_ID_PADDING,
  DEFAULT_CERTIFICATE_ID_PREFIX,
  DEFAULT_CERTIFICATE_TEMPLATE_PATH,
  getRenderFieldConfig,
  parseFieldConfig,
  type CertificateTemplateFieldConfig,
} from "@/lib/certificates/field-config";
import { parseCertificateIssueDate } from "@/lib/certificates/parse-date";
import { normalizeName } from "@/lib/certificates/parse-csv";
import { getResendConfig } from "@/lib/email/resend";
import { sendEmail } from "@/lib/email/send";
import {
  buildCertificateDeliveryEmailHtml,
  buildCertificateDeliveryEmailSubject,
  buildCertificateDeliveryEmailText,
} from "@/lib/email/templates/certificate-delivery";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Certificate, CertificateBatch, CertificateTemplate } from "@/types";

const CERTIFICATES_PATH = "/admin/certificates";

export type BulkIssueRowInput = {
  rowIndex: number;
  studentName: string;
  courseName: string;
  email?: string;
  phone?: string;
};

export type BulkIssueResultItem = {
  rowIndex: number;
  success: boolean;
  certificateId?: string;
  certificateNumber?: string;
  error?: string;
};

type TemplateRow = {
  id: string;
  name: string;
  image_url: string;
  field_config: unknown;
  is_active: boolean;
  id_prefix: string;
  id_padding: number;
  created_at: string;
  updated_at: string;
};

function normalizeTemplateImageUrl(imageUrl: string): string {
  if (imageUrl.includes("ICTF - Certificate")) {
    return DEFAULT_CERTIFICATE_TEMPLATE_PATH;
  }
  return imageUrl;
}

function mapTemplateRow(row: TemplateRow): CertificateTemplate {
  return {
    id: row.id,
    name: row.name,
    imageUrl: normalizeTemplateImageUrl(row.image_url),
    fieldConfig: parseFieldConfig(row.field_config),
    isActive: row.is_active,
    idPrefix: row.id_prefix,
    idPadding: row.id_padding,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBatchRow(row: {
  id: string;
  name: string;
  template_id: string | null;
  issue_date: string;
  created_by: string | null;
  status: string;
  total_count: number;
  success_count: number;
  error_log: unknown;
  created_at: string;
}): CertificateBatch {
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id,
    issueDate: row.issue_date,
    createdBy: row.created_by,
    status: row.status as CertificateBatch["status"],
    totalCount: row.total_count,
    successCount: row.success_count,
    errorLog: Array.isArray(row.error_log) ? (row.error_log as CertificateBatch["errorLog"]) : [],
    createdAt: row.created_at,
  };
}

function getAppUrl(): string {
  return getResendConfig()?.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://ictf.lk";
}

async function renderCertificateImage(
  templateImageUrl: string,
  fieldConfig: CertificateTemplateFieldConfig,
  data: {
    certificateNumber: string;
    studentName: string;
    courseName: string;
    issueDate: Date;
  }
) {
  const { generateCertificateImage } = await import("@/lib/certificates/generate-image");
  return generateCertificateImage(normalizeTemplateImageUrl(templateImageUrl), fieldConfig, data);
}

async function getActiveTemplateRecord(): Promise<TemplateRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificate_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as TemplateRow | null;
}

export async function ensureDefaultCertificateTemplate(): Promise<CertificateTemplate | null> {
  try {
    await requireStaff();
    const supabase = await createClient();
    const existing = await getActiveTemplateRecord();
    if (existing) return mapTemplateRow(existing);

    const { data, error } = await supabase
      .from("certificate_templates")
      .insert({
        name: "ICTF Certificate of Completion",
        image_url: DEFAULT_CERTIFICATE_TEMPLATE_PATH,
        field_config: DEFAULT_CERTIFICATE_FIELD_CONFIG,
        is_active: true,
        id_prefix: DEFAULT_CERTIFICATE_ID_PREFIX,
        id_padding: DEFAULT_CERTIFICATE_ID_PADDING,
      })
      .select("*")
      .single();

    if (error || !data) return null;
    return mapTemplateRow(data as TemplateRow);
  } catch {
    return null;
  }
}

export async function getActiveCertificateTemplate(): Promise<CertificateTemplate | null> {
  await requireStaff();
  const row = await getActiveTemplateRecord();
  return row ? mapTemplateRow(row) : ensureDefaultCertificateTemplate();
}

export async function uploadCertificateTemplate(formData: FormData) {
  await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return actionFailure(new Error("No file provided"), "No file provided");
  }

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return actionFailure(new Error("Invalid file type"), "Upload a PNG, JPEG, WebP, or GIF image");
  }

  const { prepareRasterImageUpload } = await import("@/lib/images/process-raster-upload");
  const { buffer, contentType, ext } = await prepareRasterImageUpload(file, "template");
  const admin = createAdminClient();
  const path = `templates/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await admin.storage.from("admin").upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (uploadError) return actionFailure(uploadError, "Failed to upload template");

  const { buildAdminPublicUrl } = await import("@/lib/storage/public-url");
  const imageUrl = buildAdminPublicUrl(path);
  const supabase = await createClient();

  await supabase.from("certificate_templates").update({ is_active: false }).eq("is_active", true);

  const name = String(formData.get("name") ?? "Custom Certificate Template");
  const { data, error } = await supabase
    .from("certificate_templates")
    .insert({
      name,
      image_url: imageUrl,
      field_config: DEFAULT_CERTIFICATE_FIELD_CONFIG,
      is_active: true,
      id_prefix: DEFAULT_CERTIFICATE_ID_PREFIX,
      id_padding: DEFAULT_CERTIFICATE_ID_PADDING,
    })
    .select("*")
    .single();

  if (error || !data) return actionFailure(error, "Failed to save template");

  revalidatePath(CERTIFICATES_PATH);
  return { ok: true as const, template: mapTemplateRow(data as TemplateRow) };
}

export async function resetCertificateTemplateToDefault() {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("certificate_templates").update({ is_active: false }).eq("is_active", true);

  const { data, error } = await supabase
    .from("certificate_templates")
    .insert({
      name: "ICTF Certificate of Completion",
      image_url: DEFAULT_CERTIFICATE_TEMPLATE_PATH,
      field_config: DEFAULT_CERTIFICATE_FIELD_CONFIG,
      is_active: true,
      id_prefix: DEFAULT_CERTIFICATE_ID_PREFIX,
      id_padding: DEFAULT_CERTIFICATE_ID_PADDING,
    })
    .select("*")
    .single();

  if (error || !data) return actionFailure(error, "Failed to reset template");

  revalidatePath(CERTIFICATES_PATH);
  return { ok: true as const, template: mapTemplateRow(data as TemplateRow) };
}

export async function updateCertificateTemplateConfig(fieldConfig: CertificateTemplateFieldConfig) {
  await requireStaff();
  const template = await getActiveTemplateRecord();
  if (!template) return actionFailure(new Error("No active template"), "No active template");

  const supabase = await createClient();
  const { error } = await supabase
    .from("certificate_templates")
    .update({ field_config: fieldConfig, updated_at: new Date().toISOString() })
    .eq("id", template.id);

  if (error) return actionFailure(error, "Failed to update template config");
  revalidatePath(CERTIFICATES_PATH);
  return { ok: true as const };
}

async function matchStudentAndCourse(
  admin: ReturnType<typeof createAdminClient>,
  studentName: string,
  courseName: string,
  email?: string
) {
  const [{ data: students }, { data: courses }] = await Promise.all([
    admin.from("students").select("id, display_name, email"),
    admin.from("courses").select("id, name"),
  ]);

  let studentId: string | null = null;
  if (email) {
    const byEmail = students?.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (byEmail) studentId = byEmail.id;
  }
  if (!studentId) {
    const normalized = normalizeName(studentName);
    const byName = students?.find((s) => normalizeName(s.display_name) === normalized);
    if (byName) studentId = byName.id;
  }

  const courseMatch = courses?.find((c) => normalizeName(c.name) === normalizeName(courseName));
  return {
    studentId,
    courseId: courseMatch?.id ?? null,
  };
}

async function issueOneCertificate(params: {
  template: TemplateRow;
  batchId: string;
  issueDate: Date;
  row: BulkIssueRowInput;
  autoSendEmail?: boolean;
}): Promise<BulkIssueResultItem> {
  const admin = createAdminClient();
  const supabase = await createClient();

  try {
    const certificateNumber = await allocateCertificateNumber(
      supabase,
      params.template.id_prefix,
      params.template.id_padding
    );

    const fieldConfig = getRenderFieldConfig(params.template.field_config);
    const pngBuffer = await renderCertificateImage(params.template.image_url, fieldConfig, {
      certificateNumber,
      studentName: params.row.studentName,
      courseName: params.row.courseName,
      issueDate: params.issueDate,
    });

    const storagePath = `issued/${params.batchId}/${certificateNumber}.png`;
    const { error: uploadError } = await admin.storage.from("certificates").upload(storagePath, pngBuffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (uploadError) throw new Error(uploadError.message);

    const { studentId, courseId } = await matchStudentAndCourse(
      admin,
      params.row.studentName,
      params.row.courseName,
      params.row.email
    );

    const { data: inserted, error: insertError } = await supabase
      .from("certificates")
      .insert({
        student_id: studentId,
        student_name: params.row.studentName,
        course_id: courseId,
        course_name: params.row.courseName,
        certificate_number: certificateNumber,
        verify_code: certificateNumber,
        batch_id: params.batchId,
        image_path: storagePath,
        recipient_email: params.row.email ?? null,
        recipient_phone: params.row.phone ?? null,
        delivery_status: "pending",
        issued_at: params.issueDate.toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !inserted) throw new Error(insertError?.message ?? "Failed to save certificate");

    await logAdminAction("certificate.bulk_issue", "certificate", inserted.id, {
      certificateNumber,
      batchId: params.batchId,
    });

    if (params.autoSendEmail && params.row.email) {
      await sendCertificateEmail(inserted.id);
    }

    return {
      rowIndex: params.row.rowIndex,
      success: true,
      certificateId: inserted.id,
      certificateNumber,
    };
  } catch (error) {
    return {
      rowIndex: params.row.rowIndex,
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate certificate",
    };
  }
}

export async function bulkIssueCertificates(input: {
  batchName: string;
  issueDate: string;
  rows: BulkIssueRowInput[];
  autoSendEmail?: boolean;
}) {
  await requireStaff();
  const profile = await getSessionProfile();
  const template = await getActiveTemplateRecord();
  if (!template) return actionFailure(new Error("No active template"), "Upload or activate a certificate template first");
  if (input.rows.length === 0) return actionFailure(new Error("No rows"), "No certificate rows to process");

  const supabase = await createClient();
  const issueDate = parseCertificateIssueDate(input.issueDate);

  const { data: batch, error: batchError } = await supabase
    .from("certificate_batches")
    .insert({
      name: input.batchName,
      template_id: template.id,
      issue_date: input.issueDate,
      created_by: profile?.id ?? null,
      status: "processing",
      total_count: input.rows.length,
      success_count: 0,
    })
    .select("*")
    .single();

  if (batchError || !batch) return actionFailure(batchError, "Failed to create batch");

  const results: BulkIssueResultItem[] = [];
  for (const row of input.rows) {
    const result = await issueOneCertificate({
      template,
      batchId: batch.id,
      issueDate,
      row,
      autoSendEmail: input.autoSendEmail,
    });
    results.push(result);
  }

  const successCount = results.filter((r) => r.success).length;
  const errorLog = results
    .filter((r) => !r.success)
    .map((r) => ({ rowIndex: r.rowIndex, error: r.error ?? "Unknown error" }));

  await supabase
    .from("certificate_batches")
    .update({
      status: successCount === input.rows.length ? "completed" : successCount > 0 ? "completed" : "failed",
      success_count: successCount,
      error_log: errorLog,
    })
    .eq("id", batch.id);

  revalidatePath(CERTIFICATES_PATH);
  return {
    ok: true as const,
    batchId: batch.id,
    results,
    successCount,
    failedCount: input.rows.length - successCount,
  };
}

export async function issueManualCertificate(input: {
  studentName: string;
  courseName: string;
  issueDate: string;
  email?: string;
  phone?: string;
  autoSendEmail?: boolean;
}) {
  const studentName = input.studentName.trim();
  const courseName = input.courseName.trim();
  if (!studentName) return actionFailure(new Error("Name required"), "Student name is required");
  if (!courseName) return actionFailure(new Error("Course required"), "Course name is required");
  if (!input.issueDate) return actionFailure(new Error("Date required"), "Issue date is required");

  const result = await bulkIssueCertificates({
    batchName: `Manual — ${studentName}`,
    issueDate: input.issueDate,
    autoSendEmail: input.autoSendEmail ?? true,
    rows: [
      {
        rowIndex: 1,
        studentName,
        courseName,
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
      },
    ],
  });

  if (!result.ok) return result;

  const first = result.results[0];
  if (!first?.success) {
    return actionFailure(new Error(first?.error ?? "Failed"), first?.error ?? "Failed to issue certificate");
  }

  return {
    ok: true as const,
    certificateId: first.certificateId,
    certificateNumber: first.certificateNumber,
    batchId: result.batchId,
  };
}

async function getTemplateForCertificate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string | null
): Promise<TemplateRow | null> {
  if (batchId) {
    const { data: batch } = await supabase
      .from("certificate_batches")
      .select("template_id")
      .eq("id", batchId)
      .maybeSingle();
    if (batch?.template_id) {
      const { data: template } = await supabase
        .from("certificate_templates")
        .select("*")
        .eq("id", batch.template_id)
        .maybeSingle();
      if (template) return template as TemplateRow;
    }
  }
  return getActiveTemplateRecord();
}

export async function updateCertificate(
  certificateId: string,
  data: {
    studentName: string;
    courseName: string;
    issueDate: string;
    recipientEmail?: string;
    recipientPhone?: string;
  }
) {
  try {
    await requireStaff();
    const studentName = data.studentName.trim();
    const courseName = data.courseName.trim();
    if (!studentName) return actionFailure(new Error("Name required"), "Student name is required");
    if (!courseName) return actionFailure(new Error("Course required"), "Course name is required");
    if (!data.issueDate) return actionFailure(new Error("Date required"), "Issue date is required");

    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: cert, error: fetchError } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", certificateId)
      .maybeSingle();

    if (fetchError || !cert) return actionFailure(fetchError, "Certificate not found");

    const certificateNumber = cert.certificate_number ?? cert.verify_code;
    if (!certificateNumber) {
      return actionFailure(new Error("Missing number"), "Certificate number is missing");
    }

    const template = await getTemplateForCertificate(supabase, cert.batch_id);
    if (!template) return actionFailure(new Error("No template"), "No certificate template available");

    const issueDate = parseCertificateIssueDate(data.issueDate);
    const fieldConfig = getRenderFieldConfig(template.field_config);
    const pngBuffer = await renderCertificateImage(normalizeTemplateImageUrl(template.image_url), fieldConfig, {
      certificateNumber,
      studentName,
      courseName,
      issueDate,
    });

    const storagePath =
      cert.image_path ?? `issued/${cert.batch_id ?? "manual"}/${certificateNumber}.png`;
    const { error: uploadError } = await admin.storage.from("certificates").upload(storagePath, pngBuffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (uploadError) return actionFailure(uploadError, "Failed to regenerate certificate image");

    const { studentId, courseId } = await matchStudentAndCourse(
      admin,
      studentName,
      courseName,
      data.recipientEmail
    );

    const { error: updateError } = await supabase
      .from("certificates")
      .update({
        student_name: studentName,
        course_name: courseName,
        issued_at: issueDate.toISOString(),
        student_id: studentId,
        course_id: courseId,
        recipient_email: data.recipientEmail?.trim() || null,
        recipient_phone: data.recipientPhone?.trim() || null,
        image_path: storagePath,
      })
      .eq("id", certificateId);

    if (updateError) return actionFailure(updateError, "Failed to update certificate");

    await logAdminAction("certificate.update", "certificate", certificateId, {
      certificateNumber,
      studentName,
      courseName,
      issueDate: data.issueDate,
    });

    revalidatePath(CERTIFICATES_PATH);
    revalidatePath(`/verify/${certificateNumber}`);
    return { ok: true as const, certificateNumber };
  } catch (error) {
    return actionFailure(error, "Failed to update certificate");
  }
}

export async function getCertificateSignedUrl(certificateId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data: cert } = await supabase
    .from("certificates")
    .select("image_path, certificate_number")
    .eq("id", certificateId)
    .maybeSingle();

  if (!cert?.image_path) return actionFailure(new Error("Not found"), "Certificate image not found");

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("certificates").createSignedUrl(cert.image_path, 3600);
  if (error || !data?.signedUrl) return actionFailure(error, "Failed to create download link");

  return { ok: true as const, url: data.signedUrl, certificateNumber: cert.certificate_number };
}

export async function sendCertificateEmail(certificateId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data: cert } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", certificateId)
    .maybeSingle();

  if (!cert) return actionFailure(new Error("Not found"), "Certificate not found");
  if (!cert.recipient_email) return actionFailure(new Error("No email"), "No recipient email on this certificate");

  const appUrl = getAppUrl();
  const verifyCode = cert.certificate_number ?? cert.verify_code;
  const verifyUrl = `${appUrl}/verify/${verifyCode}`;

  let attachment: Buffer | undefined;
  if (cert.image_path) {
    const admin = createAdminClient();
    const { data: fileData, error: downloadError } = await admin.storage
      .from("certificates")
      .download(cert.image_path);
    if (!downloadError && fileData) {
      attachment = Buffer.from(await fileData.arrayBuffer());
    }
  }

  const emailData = {
    studentName: cert.student_name,
    courseName: cert.course_name,
    certificateNumber: verifyCode ?? certificateId,
    verifyUrl,
  };

  const result = await sendEmail({
    to: cert.recipient_email,
    subject: buildCertificateDeliveryEmailSubject(emailData.certificateNumber),
    html: buildCertificateDeliveryEmailHtml(emailData),
    text: buildCertificateDeliveryEmailText(emailData),
    attachments: attachment
      ? [
          {
            filename: `${emailData.certificateNumber}.png`,
            content: attachment,
            contentType: "image/png",
          },
        ]
      : undefined,
  });

  if (!result.emailSent) {
    await supabase
      .from("certificates")
      .update({ delivery_status: "failed" })
      .eq("id", certificateId);
    return actionFailure(new Error(result.error ?? "Send failed"), result.error ?? "Failed to send email");
  }

  await supabase
    .from("certificates")
    .update({
      delivery_status: "email_sent",
      email_sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
    })
    .eq("id", certificateId);

  revalidatePath(CERTIFICATES_PATH);
  return { ok: true as const };
}

export async function sendBulkCertificateEmails(batchId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data: certs } = await supabase
    .from("certificates")
    .select("id, recipient_email, delivery_status")
    .eq("batch_id", batchId)
    .eq("delivery_status", "pending")
    .not("recipient_email", "is", null);

  if (!certs?.length) return { ok: true as const, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (const cert of certs) {
    const result = await sendCertificateEmail(cert.id);
    if (result.ok) sent += 1;
    else failed += 1;
  }

  revalidatePath(CERTIFICATES_PATH);
  return { ok: true as const, sent, failed };
}

export async function previewCertificateImage(input: {
  studentName: string;
  courseName: string;
  issueDate: string;
  certificateNumber?: string;
}) {
  try {
    await requireStaff();
    const template = await getActiveTemplateRecord();
    if (!template) return actionFailure(new Error("No template"), "No active template");

    const fieldConfig = getRenderFieldConfig(template.field_config);
    const pngBuffer = await renderCertificateImage(template.image_url, fieldConfig, {
      certificateNumber: input.certificateNumber ?? `${template.id_prefix}-PREVIEW`,
      studentName: input.studentName,
      courseName: input.courseName,
      issueDate: parseCertificateIssueDate(input.issueDate),
    });

    return {
      ok: true as const,
      dataUrl: `data:image/png;base64,${pngBuffer.toString("base64")}`,
    };
  } catch (error) {
    return actionFailure(error, "Failed to generate certificate preview");
  }
}

export async function listCertificateBatches(): Promise<CertificateBatch[]> {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("certificate_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return [];
    return (data ?? []).map((row) => mapBatchRow(row as Parameters<typeof mapBatchRow>[0]));
  } catch {
    return [];
  }
}

export type CertificateListItem = Certificate & {
  recipientEmail?: string;
  recipientPhone?: string;
  deliveryStatus: Certificate["deliveryStatus"];
  imagePath?: string;
  batchId?: string;
};

export async function listCertificatesForAdmin(): Promise<CertificateListItem[]> {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { data, error } = await supabase.from("certificates").select("*").order("issued_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => {
      const extended = row as typeof row & {
        verify_code?: string;
        certificate_number?: string;
        recipient_email?: string;
        recipient_phone?: string;
        delivery_status?: string;
        image_path?: string;
        batch_id?: string;
        student_id?: string | null;
        course_id?: string | null;
      };
      return {
        id: extended.id,
        studentId: extended.student_id ?? "",
        studentName: extended.student_name,
        courseId: extended.course_id ?? "",
        courseName: extended.course_name,
        issuedAt: extended.issued_at,
        verifyCode: extended.verify_code,
        certificateNumber: extended.certificate_number,
        recipientEmail: extended.recipient_email,
        recipientPhone: extended.recipient_phone,
        deliveryStatus: (extended.delivery_status ?? "pending") as Certificate["deliveryStatus"],
        imagePath: extended.image_path,
        batchId: extended.batch_id ?? undefined,
      };
    });
  } catch {
    return [];
  }
}

export async function getCertificateStats() {
  try {
    await requireStaff();
    const supabase = await createClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [{ count: total }, { count: thisMonth }, { count: pending }] = await Promise.all([
      supabase.from("certificates").select("*", { count: "exact", head: true }),
      supabase.from("certificates").select("*", { count: "exact", head: true }).gte("issued_at", monthStart),
      supabase.from("certificates").select("*", { count: "exact", head: true }).eq("delivery_status", "pending"),
    ]);

    return {
      total: total ?? 0,
      thisMonth: thisMonth ?? 0,
      pendingDelivery: pending ?? 0,
    };
  } catch {
    return { total: 0, thisMonth: 0, pendingDelivery: 0 };
  }
}
