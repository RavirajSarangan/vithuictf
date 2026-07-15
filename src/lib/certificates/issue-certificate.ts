import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Certificate } from "@/types";
import { allocateCertificateNumber } from "@/lib/certificates/numbering";
import {
  DEFAULT_CERTIFICATE_TEMPLATE_PATH,
  getRenderFieldConfig,
} from "@/lib/certificates/field-config";
import { normalizeName } from "@/lib/certificates/parse-csv";
import { sendEmail } from "@/lib/email/send";
import {
  buildCertificateDeliveryEmailHtml,
  buildCertificateDeliveryEmailSubject,
  buildCertificateDeliveryEmailText,
} from "@/lib/email/templates/certificate-delivery";

type AnySupabase = SupabaseClient<Database>;

export type CertificateTemplateRow = {
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

/** The seeded default template's baked-in filename predates the current static asset path. */
export function normalizeTemplateImageUrl(imageUrl: string): string {
  if (imageUrl.includes("ICTF - Certificate")) {
    return DEFAULT_CERTIFICATE_TEMPLATE_PATH;
  }
  return imageUrl;
}

export async function renderCertificateImage(
  templateImageUrl: string,
  fieldConfig: ReturnType<typeof getRenderFieldConfig>,
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

export async function getActiveTemplateRecordForClient(
  client: AnySupabase
): Promise<CertificateTemplateRow | null> {
  const { data } = await client
    .from("certificate_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CertificateTemplateRow | null) ?? null;
}

export async function matchStudentAndCourse(
  admin: AnySupabase,
  studentName: string,
  courseName: string,
  email?: string
): Promise<{ studentId: string | null; courseId: string | null }> {
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

export type GenerateCertificateInput = {
  admin: AnySupabase;
  template: CertificateTemplateRow;
  studentName: string;
  courseName: string;
  issueDate: Date;
  email?: string | null;
  phone?: string | null;
  storageFolder: string;
  batchId?: string | null;
  claimLinkId?: string | null;
  autoSendEmail?: boolean;
  appUrl?: string;
  /** Update this already-reserved row instead of inserting a new one. */
  existingCertificateId?: string;
};

/** Allocates a number, renders the image, uploads it, and inserts/updates the certificate row. */
export async function generateAndPersistCertificate(
  input: GenerateCertificateInput
): Promise<{ id: string; certificateNumber: string }> {
  const certificateNumber = await allocateCertificateNumber(
    input.admin,
    input.template.id_prefix,
    input.template.id_padding
  );

  const fieldConfig = getRenderFieldConfig(input.template.field_config);
  const pngBuffer = await renderCertificateImage(input.template.image_url, fieldConfig, {
    certificateNumber,
    studentName: input.studentName,
    courseName: input.courseName,
    issueDate: input.issueDate,
  });

  const storagePath = `${input.storageFolder}/${certificateNumber}.png`;
  const { error: uploadError } = await input.admin.storage
    .from("certificates")
    .upload(storagePath, pngBuffer, { contentType: "image/png", upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { studentId, courseId } = await matchStudentAndCourse(
    input.admin,
    input.studentName,
    input.courseName,
    input.email ?? undefined
  );

  const payload = {
    student_id: studentId,
    student_name: input.studentName,
    course_id: courseId,
    course_name: input.courseName,
    certificate_number: certificateNumber,
    verify_code: certificateNumber,
    batch_id: input.batchId ?? null,
    claim_link_id: input.claimLinkId ?? null,
    image_path: storagePath,
    recipient_email: input.email ?? null,
    recipient_phone: input.phone ?? null,
    delivery_status: "pending",
    issued_at: input.issueDate.toISOString(),
  };

  let certificateId: string;
  if (input.existingCertificateId) {
    const { data, error } = await input.admin
      .from("certificates")
      .update(payload)
      .eq("id", input.existingCertificateId)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to save certificate");
    certificateId = data.id;
  } else {
    const { data, error } = await input.admin
      .from("certificates")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to save certificate");
    certificateId = data.id;
  }

  if (input.autoSendEmail && input.email) {
    await sendCertificateEmailCore(input.admin, certificateId, input.appUrl);
  }

  return { id: certificateId, certificateNumber };
}

export type CertificateListItem = Certificate & {
  recipientEmail?: string;
  recipientPhone?: string;
  deliveryStatus: Certificate["deliveryStatus"];
  imagePath?: string;
  batchId?: string;
};

/** Maps a raw `certificates` table row to the shape used by admin list views. */
export function mapCertificateRow(row: {
  id: string;
  student_name: string;
  course_name: string;
  issued_at: string;
  verify_code?: string;
  certificate_number?: string;
  recipient_email?: string;
  recipient_phone?: string;
  delivery_status?: string;
  image_path?: string;
  batch_id?: string;
  student_id?: string | null;
  course_id?: string | null;
}): CertificateListItem {
  return {
    id: row.id,
    studentId: row.student_id ?? "",
    studentName: row.student_name,
    courseId: row.course_id ?? "",
    courseName: row.course_name,
    issuedAt: row.issued_at,
    verifyCode: row.verify_code,
    certificateNumber: row.certificate_number,
    recipientEmail: row.recipient_email,
    recipientPhone: row.recipient_phone,
    deliveryStatus: (row.delivery_status ?? "pending") as Certificate["deliveryStatus"],
    imagePath: row.image_path,
    batchId: row.batch_id ?? undefined,
  };
}

/** Session-agnostic certificate email sender — always uses the passed-in client. */
export async function sendCertificateEmailCore(
  admin: AnySupabase,
  certificateId: string,
  appUrl?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: cert } = await admin
    .from("certificates")
    .select("*")
    .eq("id", certificateId)
    .maybeSingle();

  if (!cert) return { ok: false, error: "Certificate not found" };
  if (!cert.recipient_email) return { ok: false, error: "No recipient email on this certificate" };

  const resolvedAppUrl = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://ictf.lk";
  const verifyCode = cert.certificate_number ?? cert.verify_code;
  const verifyUrl = `${resolvedAppUrl}/verify/${verifyCode}`;

  let attachment: Buffer | undefined;
  if (cert.image_path) {
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
    await admin.from("certificates").update({ delivery_status: "failed" }).eq("id", certificateId);
    return { ok: false, error: result.error ?? "Failed to send email" };
  }

  await admin
    .from("certificates")
    .update({
      delivery_status: "email_sent",
      email_sent_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
    })
    .eq("id", certificateId);

  return { ok: true };
}
