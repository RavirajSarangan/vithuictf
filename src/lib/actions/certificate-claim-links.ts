"use server";

import { safeRevalidatePath as revalidatePath } from "@/lib/safe-revalidate";
import { requireStaff, getSessionProfile } from "@/lib/actions/auth";
import { actionFailure } from "@/lib/actions/action-result";
import { getAppUrl } from "@/lib/actions/certificates";
import { logAdminAction } from "@/lib/audit";
import {
  getActiveTemplateRecordForClient,
  mapCertificateRow,
  type CertificateListItem,
} from "@/lib/certificates/issue-certificate";
import { createClient } from "@/lib/supabase/server";
import type { CertificateClaimLink, CertificateClaimLinkStatus } from "@/types";

const CERTIFICATES_PATH = "/admin/certificates";

function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

type ClaimLinkRow = {
  id: string;
  slug: string;
  course_name: string;
  issue_date: string;
  template_id: string | null;
  status: CertificateClaimLinkStatus;
  max_claims: number | null;
  claim_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function mapClaimLinkRow(row: ClaimLinkRow): CertificateClaimLink {
  return {
    id: row.id,
    slug: row.slug,
    courseName: row.course_name,
    issueDate: row.issue_date,
    templateId: row.template_id,
    status: row.status,
    maxClaims: row.max_claims,
    claimCount: row.claim_count,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCertificateClaimLink(input: {
  courseName: string;
  issueDate: string;
  maxClaims?: number;
}) {
  try {
    await requireStaff();
    const courseName = input.courseName.trim();
    if (!courseName) return actionFailure(new Error("Course required"), "Course name is required");
    if (!input.issueDate) return actionFailure(new Error("Date required"), "Issue date is required");

    const profile = await getSessionProfile();
    const supabase = await createClient();

    const template = await getActiveTemplateRecordForClient(supabase);
    if (!template) {
      return actionFailure(new Error("No active template"), "Upload or activate a certificate template first");
    }

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const slug = generateSlug();
      const { data, error } = await supabase
        .from("certificate_claim_links")
        .insert({
          slug,
          course_name: courseName,
          issue_date: input.issueDate,
          template_id: template.id,
          max_claims: input.maxClaims ?? null,
          created_by: profile?.id ?? null,
        })
        .select("*")
        .single();

      if (!error && data) {
        await logAdminAction("certificate.claim_link.create", "certificate_claim_link", data.id, {
          courseName,
          slug,
        });
        revalidatePath(CERTIFICATES_PATH);
        const claimLink = mapClaimLinkRow(data as ClaimLinkRow);
        return {
          ok: true as const,
          claimLink,
          claimUrl: `${await getAppUrl()}/certificate/claim/${claimLink.slug}`,
        };
      }

      lastError = error;
      if (error?.code !== "23505") break;
    }

    return actionFailure(lastError, "Failed to create claim link");
  } catch (error) {
    return actionFailure(error, "Failed to create claim link");
  }
}

export async function listCertificateClaimLinks(): Promise<CertificateClaimLink[]> {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("certificate_claim_links")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => mapClaimLinkRow(row as ClaimLinkRow));
  } catch {
    return [];
  }
}

export async function updateCertificateClaimLinkStatus(id: string, status: CertificateClaimLinkStatus) {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { error } = await supabase
      .from("certificate_claim_links")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return actionFailure(error, "Failed to update claim link");

    await logAdminAction("certificate.claim_link.status_update", "certificate_claim_link", id, { status });
    revalidatePath(CERTIFICATES_PATH);
    return { ok: true as const };
  } catch (error) {
    return actionFailure(error, "Failed to update claim link");
  }
}

export async function deleteCertificateClaimLink(id: string) {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { error } = await supabase.from("certificate_claim_links").delete().eq("id", id);

    if (error) return actionFailure(error, "Failed to delete claim link");

    await logAdminAction("certificate.claim_link.delete", "certificate_claim_link", id);
    revalidatePath(CERTIFICATES_PATH);
    return { ok: true as const };
  } catch (error) {
    return actionFailure(error, "Failed to delete claim link");
  }
}

export async function listCertificatesForClaimLink(claimLinkId: string): Promise<CertificateListItem[]> {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("claim_link_id", claimLinkId)
      .order("issued_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => mapCertificateRow(row as Parameters<typeof mapCertificateRow>[0]));
  } catch {
    return [];
  }
}
