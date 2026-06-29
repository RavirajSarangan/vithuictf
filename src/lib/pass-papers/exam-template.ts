import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PassPaperExamType } from "@/types";

type DbClient = SupabaseClient<Database>;

const MEDIUMS = [
  { title: "English Medium", slug: "english-medium", sortOrder: 1 },
  { title: "Sinhala Medium", slug: "sinhala-medium", sortOrder: 2 },
  { title: "Tamil Medium", slug: "tamil-medium", sortOrder: 3 },
] as const;

const EXAM_TEMPLATE_CONFIG: Record<
  Extract<PassPaperExamType, "al" | "ol">,
  { title: string; slug: string; description: string; sortOrder: number; levelLabel: string }
> = {
  al: {
    title: "A/L Past Papers",
    slug: "a-l-past-papers",
    description: "Advanced Level past papers organized by medium and year.",
    sortOrder: 0,
    levelLabel: "A/L",
  },
  ol: {
    title: "O/L Past Papers",
    slug: "o-l-past-papers",
    description: "Ordinary Level past papers organized by medium and year.",
    sortOrder: 1,
    levelLabel: "O/L",
  },
};

export type EnsureExamTemplateResult = {
  rootId: string;
  createdFolders: number;
};

export async function ensurePassPaperExamTemplateInternal(
  supabase: DbClient,
  examType: Extract<PassPaperExamType, "al" | "ol">,
  options?: { startYear?: number; endYear?: number }
): Promise<EnsureExamTemplateResult> {
  const config = EXAM_TEMPLATE_CONFIG[examType];
  const startYear = options?.startYear ?? 2011;
  const endYear = options?.endYear ?? 2025;
  let createdFolders = 0;

  const { data: existingRoot, error: rootLookupError } = await supabase
    .from("pass_paper_folders")
    .select("id")
    .is("parent_id", null)
    .eq("slug", config.slug)
    .maybeSingle();

  if (rootLookupError) throw new Error(rootLookupError.message);

  let rootId = existingRoot?.id ?? null;

  if (!rootId) {
    const { data: insertedRoot, error: rootInsertError } = await supabase
      .from("pass_paper_folders")
      .insert({
        parent_id: null,
        title: config.title,
        slug: config.slug,
        description: config.description,
        icon_key: "graduation-cap",
        accent_color: "#1e3a5f",
        layout: "folder",
        sort_order: config.sortOrder,
        published: false,
      })
      .select("id")
      .single();

    if (rootInsertError) throw new Error(rootInsertError.message);
    rootId = insertedRoot.id;
    createdFolders += 1;
  }

  for (const medium of MEDIUMS) {
    const { data: existingMedium, error: mediumLookupError } = await supabase
      .from("pass_paper_folders")
      .select("id")
      .eq("parent_id", rootId)
      .eq("slug", medium.slug)
      .maybeSingle();

    if (mediumLookupError) throw new Error(mediumLookupError.message);

    let mediumId = existingMedium?.id ?? null;

    if (!mediumId) {
      const { data: insertedMedium, error: mediumInsertError } = await supabase
        .from("pass_paper_folders")
        .insert({
          parent_id: rootId,
          title: medium.title,
          slug: medium.slug,
          description: `${medium.title} ${config.levelLabel} past papers.`,
          icon_key: "folder-open",
          accent_color: "#1e3a5f",
          layout: "folder",
          sort_order: medium.sortOrder,
          published: false,
        })
        .select("id")
        .single();

      if (mediumInsertError) throw new Error(mediumInsertError.message);
      mediumId = insertedMedium.id;
      createdFolders += 1;
    }

    const { data: existingYears, error: yearsLookupError } = await supabase
      .from("pass_paper_folders")
      .select("slug")
      .eq("parent_id", mediumId);

    if (yearsLookupError) throw new Error(yearsLookupError.message);

    const existingYearSlugs = new Set((existingYears ?? []).map((row) => row.slug));

    for (let year = startYear; year <= endYear; year++) {
      const slug = String(year);
      if (existingYearSlugs.has(slug)) continue;

      const { error: yearInsertError } = await supabase.from("pass_paper_folders").insert({
        parent_id: mediumId,
        title: slug,
        slug,
        description: "",
        icon_key: "folder",
        accent_color: "#1e3a5f",
        layout: "folder",
        sort_order: year,
        published: false,
      });

      if (yearInsertError) throw new Error(yearInsertError.message);
      createdFolders += 1;
    }
  }

  return { rootId, createdFolders };
}
