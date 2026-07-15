"use server";

// PUBLIC ACTION FILE — no requireStaff() anywhere here. Every query uses the
// service-role (admin) client directly, never the session-scoped client,
// because anonymous visitors calling claimCertificate() have no session at
// all. Keep staff-only mutations in certificate-claim-links.ts instead.

import { getActionErrorMessage } from "@/lib/action-error";
import {
  generateAndPersistCertificate,
  getActiveTemplateRecordForClient,
  type CertificateTemplateRow,
} from "@/lib/certificates/issue-certificate";
import { parseCertificateIssueDate } from "@/lib/certificates/parse-date";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestClientKey } from "@/lib/security/request-client-key";
import { createAdminClient } from "@/lib/supabase/admin";
import { certificateClaimSchema } from "@/lib/validation/certificate-claim";

type AdminClient = ReturnType<typeof createAdminClient>;

type ClaimLinkRow = {
  id: string;
  slug: string;
  course_name: string;
  issue_date: string;
  template_id: string | null;
  status: string;
  max_claims: number | null;
  claim_count: number;
};

type CertificateRow = {
  id: string;
  student_name: string;
  course_name: string;
  issued_at: string;
  certificate_number: string | null;
  verify_code: string | null;
  image_path: string | null;
};

export type ClaimCertificateInput = {
  slug: string;
  studentName: string;
  email: string;
  website?: string;
};

export type ClaimCertificateResult =
  | {
      ok: true;
      certificateNumber: string;
      studentName: string;
      courseName: string;
      issuedAt: string;
      imageUrl: string | null;
      alreadyIssued: boolean;
    }
  | { ok: false; error: string };

async function findExistingCertificate(
  admin: AdminClient,
  claimLinkId: string,
  email: string
): Promise<CertificateRow | null> {
  const { data } = await admin
    .from("certificates")
    .select("id, student_name, course_name, issued_at, certificate_number, verify_code, image_path")
    .eq("claim_link_id", claimLinkId)
    .eq("recipient_email", email)
    .maybeSingle();
  return (data as CertificateRow | null) ?? null;
}

async function reserveCertificateRow(
  admin: AdminClient,
  claimLink: ClaimLinkRow,
  studentName: string,
  email: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("certificates")
    .insert({
      student_name: studentName,
      course_name: claimLink.course_name,
      claim_link_id: claimLink.id,
      recipient_email: email,
      issued_at: parseCertificateIssueDate(claimLink.issue_date).toISOString(),
      delivery_status: "pending",
    })
    .select("id")
    .single();

  if (!error && data) return { ok: true, id: data.id };

  if (error?.code === "23505") {
    // A concurrent request won the race for this email — use its row instead.
    const winner = await findExistingCertificate(admin, claimLink.id, email);
    if (winner) return { ok: true, id: winner.id };
  }

  return { ok: false, error: error?.message ?? "Failed to reserve certificate" };
}

async function getTemplateById(admin: AdminClient, templateId: string): Promise<CertificateTemplateRow | null> {
  const { data } = await admin.from("certificate_templates").select("*").eq("id", templateId).maybeSingle();
  return (data as CertificateTemplateRow | null) ?? null;
}

async function buildClaimResult(
  admin: AdminClient,
  cert: CertificateRow,
  alreadyIssued: boolean
): Promise<ClaimCertificateResult> {
  let imageUrl: string | null = null;
  if (cert.image_path) {
    const { data } = await admin.storage.from("certificates").createSignedUrl(cert.image_path, 3600);
    imageUrl = data?.signedUrl ?? null;
  }

  return {
    ok: true,
    certificateNumber: cert.certificate_number ?? cert.verify_code ?? "",
    studentName: cert.student_name,
    courseName: cert.course_name,
    issuedAt: cert.issued_at,
    imageUrl,
    alreadyIssued,
  };
}

export async function claimCertificate(input: ClaimCertificateInput): Promise<ClaimCertificateResult> {
  const parsed = certificateClaimSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
  }
  const { slug, studentName, email } = parsed.data;

  try {
    const ipKey = await getRequestClientKey();
    await assertRateLimit(`claim:ip:${ipKey}`, 30, 3600);
    await assertRateLimit(
      `claim:email:${email}`,
      5,
      3600,
      "Too many attempts with this email. Please try again later."
    );
  } catch (err) {
    return { ok: false, error: getActionErrorMessage(err, "Too many requests. Please try again later.") };
  }

  const admin = createAdminClient();

  const { data: claimLinkData } = await admin
    .from("certificate_claim_links")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const claimLink = claimLinkData as ClaimLinkRow | null;
  if (!claimLink || claimLink.status !== "active") {
    return { ok: false, error: "This certificate link is no longer active." };
  }

  try {
    const existing = await findExistingCertificate(admin, claimLink.id, email);
    if (existing?.certificate_number) {
      return buildClaimResult(admin, existing, true);
    }

    let reservedId = existing?.id;
    if (!reservedId) {
      if (claimLink.max_claims != null && claimLink.claim_count >= claimLink.max_claims) {
        return { ok: false, error: "This certificate link has reached its claim limit." };
      }
      const reserved = await reserveCertificateRow(admin, claimLink, studentName, email);
      if (!reserved.ok) return { ok: false, error: reserved.error };
      reservedId = reserved.id;
    }

    const template = claimLink.template_id
      ? await getTemplateById(admin, claimLink.template_id)
      : await getActiveTemplateRecordForClient(admin);
    if (!template) return { ok: false, error: "No certificate template is configured for this link." };

    await generateAndPersistCertificate({
      admin,
      template,
      studentName,
      courseName: claimLink.course_name,
      issueDate: parseCertificateIssueDate(claimLink.issue_date),
      email,
      storageFolder: `issued/claims/${claimLink.id}`,
      claimLinkId: claimLink.id,
      autoSendEmail: true,
      existingCertificateId: reservedId,
    });

    await admin
      .from("certificate_claim_links")
      .update({ claim_count: claimLink.claim_count + 1, updated_at: new Date().toISOString() })
      .eq("id", claimLink.id);

    const finalCert = await findExistingCertificate(admin, claimLink.id, email);
    if (!finalCert) return { ok: false, error: "Failed to generate certificate." };

    return buildClaimResult(admin, finalCert, false);
  } catch (err) {
    return { ok: false, error: getActionErrorMessage(err, "Failed to generate certificate.") };
  }
}
