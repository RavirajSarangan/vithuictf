"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAcademicsStaff, requireAdmin } from "@/lib/actions/auth";
import { actionFailure, type ActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { notifyBatchStudentsPortal } from "@/lib/academics/batch-notifications";
import { assembleBatchReportCards, type BatchReportCards } from "@/lib/report-cards/data";
import { mapReportCardPublication } from "@/lib/supabase/mappers";
import type { ReportCardPublication } from "@/types";

function revalidateReportCardPaths() {
  safeRevalidatePath("/academics/report-cards");
  safeRevalidatePath("/results");
}

export async function getBatchReportCardOverview(
  batchId: string,
  term: string
): Promise<{ publication: ReportCardPublication | null; data: BatchReportCards | null }> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const [{ data: publicationRow }, data] = await Promise.all([
    supabase
      .from("report_card_publications")
      .select("*")
      .eq("batch_id", batchId)
      .eq("term", term)
      .maybeSingle(),
    assembleBatchReportCards(supabase, batchId, term),
  ]);

  return {
    publication: publicationRow ? mapReportCardPublication(publicationRow) : null,
    data,
  };
}

export async function publishReportCards(batchId: string, term: string): Promise<ActionResult> {
  try {
    const profile = await requireAcademicsStaff();
    const supabase = await createClient();

    const data = await assembleBatchReportCards(supabase, batchId, term);
    if (!data) return { ok: false, error: "Batch not found" };
    if (!data.exams.length) {
      return { ok: false, error: `No published exams for ${term} yet — publish exam results first` };
    }

    const { error } = await supabase.from("report_card_publications").insert({
      batch_id: batchId,
      term,
      published_by: profile.id,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Report cards are already published for this term" };
      return actionFailure(error, "Failed to publish report cards");
    }

    await notifyBatchStudentsPortal(
      batchId,
      `Report card ready — ${term}`,
      `Your ${term} report card for ${data.batchName} is ready. Open Results to download it.`,
      { kind: "report_card_published", batchId, term },
      "announcement"
    );

    revalidateReportCardPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to publish report cards");
  }
}

export async function unpublishReportCards(batchId: string, term: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("report_card_publications")
      .delete()
      .eq("batch_id", batchId)
      .eq("term", term);
    if (error) return actionFailure(error, "Failed to unpublish report cards");

    revalidateReportCardPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to unpublish report cards");
  }
}
