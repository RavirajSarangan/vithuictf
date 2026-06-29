"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { paperCenterLoginPath, slugifyPaperCenterName } from "@/lib/paper-center-slug";
import {
  normalizePaperCenterGrades,
  validatePaperCenterGrades,
  type PaperCenterGrade,
} from "@/lib/paper-centers/grades";
import { revalidateMarketingPaths } from "@/lib/revalidation-paths";

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const supabase = await createClient();
  let slug = slugifyPaperCenterName(base);
  let attempt = 0;

  while (attempt < 20) {
    let query = supabase.from("paper_centers").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    attempt += 1;
    slug = `${slugifyPaperCenterName(base)}-${attempt}`;
  }

  return `${slugifyPaperCenterName(base)}-${crypto.randomUUID().slice(0, 6)}`;
}

function revalidatePaperCenterPaths() {
  revalidateMarketingPaths();
  revalidatePath("/admin/home");
  revalidatePath("/admin/paper-centers");
  revalidatePath("/admin/people");
  revalidatePath("/login/paper-center");
}

async function nextPaperCenterSortOrder(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("paper_centers")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.sort_order ?? -1) + 1;
}

async function assertCenterGradesCanBeRemoved(
  supabase: Awaited<ReturnType<typeof createClient>>,
  centerId: string,
  nextGrades: PaperCenterGrade[]
) {
  const { data: staffRows } = await supabase
    .from("paper_center_staff")
    .select("display_name, grades")
    .eq("paper_center_id", centerId);

  const nextSet = new Set(nextGrades);
  const conflicts: string[] = [];

  for (const staff of staffRows ?? []) {
    const staffGrades = normalizePaperCenterGrades(staff.grades ?? []);
    const removed = staffGrades.filter((grade) => !nextSet.has(grade));
    if (removed.length > 0) {
      conflicts.push(`${staff.display_name} (${removed.map((grade) => `G${grade}`).join(", ")})`);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Cannot remove grades still assigned to staff: ${conflicts.join("; ")}. Update staff grades first.`
    );
  }
}

export async function addManagedPaperCenter(data: {
  name: string;
  district: string;
  address: string;
  mapUrl?: string;
  slug?: string;
  grades: PaperCenterGrade[];
}) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const name = data.name.trim();
  if (!name) throw new Error("Center name is required");

  const grades = normalizePaperCenterGrades(data.grades);
  const gradeError = validatePaperCenterGrades(grades);
  if (gradeError) throw new Error(gradeError);

  const slug = data.slug?.trim()
    ? slugifyPaperCenterName(data.slug)
    : await ensureUniqueSlug(name);

  const { data: existing } = await supabase.from("paper_centers").select("id").eq("slug", slug).maybeSingle();
  if (existing) throw new Error("This URL slug is already in use");

  const sortOrder = await nextPaperCenterSortOrder(supabase);

  const { error } = await supabase.from("paper_centers").insert({
    name,
    slug,
    district: data.district.trim(),
    address: data.address.trim(),
    map_url: data.mapUrl?.trim() ?? "",
    sort_order: sortOrder,
    grades,
    is_active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePaperCenterPaths();
  return { slug, loginUrl: paperCenterLoginPath(slug) };
}

export async function updateManagedPaperCenter(
  id: string,
  data: {
    name: string;
    district: string;
    address: string;
    mapUrl?: string;
    slug?: string;
    isActive?: boolean;
    grades: PaperCenterGrade[];
  }
) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const name = data.name.trim();
  if (!name) throw new Error("Center name is required");

  const grades = normalizePaperCenterGrades(data.grades);
  const gradeError = validatePaperCenterGrades(grades);
  if (gradeError) throw new Error(gradeError);

  await assertCenterGradesCanBeRemoved(supabase, id, grades);

  const slug = data.slug?.trim()
    ? slugifyPaperCenterName(data.slug)
    : await ensureUniqueSlug(name, id);

  const { data: existing } = await supabase
    .from("paper_centers")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();

  if (existing) throw new Error("This URL slug is already in use");

  const { error } = await supabase
    .from("paper_centers")
    .update({
      name,
      slug,
      district: data.district.trim(),
      address: data.address.trim(),
      map_url: data.mapUrl?.trim() ?? "",
      grades,
      is_active: data.isActive ?? true,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePaperCenterPaths();
  return { slug, loginUrl: paperCenterLoginPath(slug) };
}

export async function deleteManagedPaperCenter(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { count } = await supabase
    .from("paper_center_staff")
    .select("id", { count: "exact", head: true })
    .eq("paper_center_id", id);

  if ((count ?? 0) > 0) {
    throw new Error("Remove or reassign paper center staff before deleting this center");
  }

  const { error } = await supabase.from("paper_centers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePaperCenterPaths();
}

export async function setManagedPaperCenterActive(id: string, isActive: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("paper_centers").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePaperCenterPaths();
}
