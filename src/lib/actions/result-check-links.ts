"use server";

import { safeRevalidatePath as revalidatePath } from "@/lib/safe-revalidate";
import { requireStaff, getSessionProfile } from "@/lib/actions/auth";
import { actionFailure } from "@/lib/actions/action-result";
import { getAppUrl } from "@/lib/actions/certificates";
import { logAdminAction } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import type { ResultCheckLink, ResultCheckLinkStatus } from "@/types";

const RESULTS_PATH = "/admin/results";

function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

type ResultCheckLinkRow = {
  id: string;
  slug: string;
  course_id: string | null;
  course_name: string;
  batch_id: string | null;
  status: ResultCheckLinkStatus;
  max_lookups: number | null;
  lookup_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function mapResultCheckLinkRow(row: ResultCheckLinkRow): ResultCheckLink {
  return {
    id: row.id,
    slug: row.slug,
    courseId: row.course_id,
    courseName: row.course_name,
    batchId: row.batch_id,
    status: row.status,
    maxLookups: row.max_lookups,
    lookupCount: row.lookup_count,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createResultCheckLink(input: {
  courseId: string;
  courseName: string;
  maxLookups?: number;
}) {
  try {
    await requireStaff();
    const courseName = input.courseName.trim();
    if (!input.courseId) return actionFailure(new Error("Course required"), "Course is required");
    if (!courseName) return actionFailure(new Error("Course required"), "Course name is required");

    const profile = await getSessionProfile();
    const supabase = await createClient();

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const slug = generateSlug();
      const { data, error } = await supabase
        .from("result_check_links")
        .insert({
          slug,
          course_id: input.courseId,
          course_name: courseName,
          max_lookups: input.maxLookups ?? null,
          created_by: profile?.id ?? null,
        })
        .select("*")
        .single();

      if (!error && data) {
        await logAdminAction("results_check.link.create", "result_check_link", data.id, {
          courseName,
          slug,
        });
        revalidatePath(RESULTS_PATH);
        const link = mapResultCheckLinkRow(data as ResultCheckLinkRow);
        return {
          ok: true as const,
          link,
          checkUrl: `${await getAppUrl()}/results/check/${link.slug}`,
        };
      }

      lastError = error;
      if (error?.code !== "23505") break;
    }

    return actionFailure(lastError, "Failed to create result check link");
  } catch (error) {
    return actionFailure(error, "Failed to create result check link");
  }
}

export async function listResultCheckLinks(): Promise<ResultCheckLink[]> {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("result_check_links")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => mapResultCheckLinkRow(row as ResultCheckLinkRow));
  } catch {
    return [];
  }
}

export async function updateResultCheckLinkStatus(id: string, status: ResultCheckLinkStatus) {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { error } = await supabase
      .from("result_check_links")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return actionFailure(error, "Failed to update result check link");

    await logAdminAction("results_check.link.status_update", "result_check_link", id, { status });
    revalidatePath(RESULTS_PATH);
    return { ok: true as const };
  } catch (error) {
    return actionFailure(error, "Failed to update result check link");
  }
}

export async function deleteResultCheckLink(id: string) {
  try {
    await requireStaff();
    const supabase = await createClient();
    const { error } = await supabase.from("result_check_links").delete().eq("id", id);

    if (error) return actionFailure(error, "Failed to delete result check link");

    await logAdminAction("results_check.link.delete", "result_check_link", id);
    revalidatePath(RESULTS_PATH);
    return { ok: true as const };
  } catch (error) {
    return actionFailure(error, "Failed to delete result check link");
  }
}
