import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  createDriveClient,
  isDriveFolder,
  isPdfFile,
  listDriveChildren,
  type DriveFileNode,
} from "@/lib/google-drive";
import {
  buildDriveFileUrl,
  buildDriveFolderUrl,
  extractDriveResourceId,
} from "@/lib/pass-papers/drive-id";
import { mapPassPaperFolder } from "@/lib/supabase/mappers";
import type { PassPaperExamType, PassPaperFolder, PassPaperMedium } from "@/types";
import type { DriveSyncOptions, DriveSyncReport } from "@/lib/pass-papers/drive-sync-types";
export type { DriveSyncOptions, DriveSyncReport } from "@/lib/pass-papers/drive-sync-types";
export { DEFAULT_DRIVE_ROOT_URL } from "@/lib/pass-papers/drive-sync-types";

type DbClient = SupabaseClient<Database>;

const EXAM_ROOT_SLUGS: Record<PassPaperExamType, string> = {
  al: "a-l-past-papers",
  ol: "o-l-past-papers",
  scholarship: "scholarship-past-papers",
  other: "other-past-papers",
};

const MEDIUM_SLUGS: Record<PassPaperMedium, string> = {
  english: "english-medium",
  sinhala: "sinhala-medium",
  tamil: "tamil-medium",
};

function parseExamType(name: string): PassPaperExamType | null {
  const normalized = name.toLowerCase();
  if (/\ba[\s/-]?l\b/.test(normalized) && !/\bo[\s/-]?l\b/.test(normalized)) return "al";
  if (/\bo[\s/-]?l\b/.test(normalized)) return "ol";
  return null;
}

function parseMedium(name: string): PassPaperMedium | null {
  const normalized = name.toLowerCase();
  if (normalized.includes("english")) return "english";
  if (normalized.includes("sinhala")) return "sinhala";
  if (normalized.includes("tamil")) return "tamil";
  return null;
}

function parseYearFromName(name: string): number | null {
  const trimmed = name.trim();
  if (/^(19|20)\d{2}$/.test(trimmed)) {
    return Number(trimmed);
  }
  const match = name.match(/\b(19|20)\d{2}\b/);
  if (!match) return null;
  const year = Number(match[0]);
  if (year < 1900 || year > 2100) return null;
  return year;
}

function findChildFolder(
  folders: PassPaperFolder[],
  parentId: string | null,
  slug: string
): PassPaperFolder | null {
  return folders.find((f) => f.parentId === parentId && f.slug === slug) ?? null;
}

function driveUrlForNode(node: DriveFileNode): string {
  return isDriveFolder(node.mimeType) ? buildDriveFolderUrl(node.id) : buildDriveFileUrl(node.id);
}

async function loadAllFolders(supabase: DbClient): Promise<PassPaperFolder[]> {
  const { data, error } = await supabase
    .from("pass_paper_folders")
    .select("*")
    .order("sort_order")
    .order("title");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPassPaperFolder(row));
}

async function loadAllItemsByDriveUrl(
  supabase: DbClient
): Promise<Map<string, { id: string; title: string; folder_id: string; published: boolean }>> {
  const { data, error } = await supabase
    .from("pass_paper_items")
    .select("id, title, folder_id, drive_url, published");
  if (error) throw new Error(error.message);
  const map = new Map<string, { id: string; title: string; folder_id: string; published: boolean }>();
  for (const row of data ?? []) {
    map.set(row.drive_url, {
      id: row.id,
      title: row.title,
      folder_id: row.folder_id,
      published: row.published,
    });
  }
  return map;
}

async function ensureYearFolder(
  supabase: DbClient,
  folders: PassPaperFolder[],
  mediumFolderId: string,
  year: number,
  dryRun: boolean
): Promise<{ folder: PassPaperFolder | null; created: boolean }> {
  const slug = String(year);
  const existing = folders.find((f) => f.parentId === mediumFolderId && f.slug === slug) ?? null;
  if (existing) return { folder: existing, created: false };

  if (dryRun) {
    return { folder: null, created: true };
  }

  const { data, error } = await supabase
    .from("pass_paper_folders")
    .insert({
      parent_id: mediumFolderId,
      title: slug,
      slug,
      description: "",
      icon_key: "folder",
      accent_color: "#1e3a5f",
      layout: "folder",
      sort_order: year,
      published: false,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const folder = mapPassPaperFolder(data);
  folders.push(folder);
  return { folder, created: true };
}

type UpsertItemInput = {
  folderId: string;
  title: string;
  driveUrl: string;
  year?: number;
  medium?: PassPaperMedium;
  examType: PassPaperExamType;
  published: boolean;
};

async function upsertDriveItem(
  supabase: DbClient,
  input: UpsertItemInput,
  existingByUrl: Map<string, { id: string; title: string; folder_id: string; published: boolean }>,
  dryRun: boolean,
  report: DriveSyncReport
): Promise<void> {
  report.scanned += 1;
  const existing = existingByUrl.get(input.driveUrl);

  if (existing) {
    const needsUpdate =
      existing.title !== input.title ||
      existing.folder_id !== input.folderId ||
      (input.published && !existing.published);

    if (!needsUpdate) {
      report.skipped += 1;
      return;
    }

    if (dryRun) {
      report.updated += 1;
      return;
    }

    const { error } = await supabase
      .from("pass_paper_items")
      .update({
        title: input.title,
        folder_id: input.folderId,
        year: input.year ?? null,
        medium: input.medium ?? null,
        exam_type: input.examType,
        published: input.published || existing.published,
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
    report.updated += 1;
    return;
  }

  if (dryRun) {
    report.created += 1;
    return;
  }

  const { data, error } = await supabase
    .from("pass_paper_items")
    .insert({
      folder_id: input.folderId,
      title: input.title,
      drive_url: input.driveUrl,
      year: input.year ?? null,
      medium: input.medium ?? null,
      exam_type: input.examType,
      sort_order: 0,
      published: input.published,
    })
    .select("id, title, folder_id, drive_url, published")
    .single();

  if (error) throw new Error(error.message);
  existingByUrl.set(input.driveUrl, {
    id: data.id,
    title: data.title,
    folder_id: data.folder_id,
    published: data.published,
  });
  report.created += 1;
}

type DriveClient = Awaited<ReturnType<typeof createDriveClient>>;

const MAX_YEAR_FOLDER_DEPTH = 4;

async function collectPdfFilesRecursive(
  drive: DriveClient,
  folderId: string,
  depth = 0
): Promise<DriveFileNode[]> {
  if (depth > MAX_YEAR_FOLDER_DEPTH) return [];

  const children = await listDriveChildren(drive, folderId);
  const pdfs: DriveFileNode[] = [];

  for (const child of children) {
    if (isPdfFile(child)) {
      pdfs.push(child);
      continue;
    }
    if (isDriveFolder(child.mimeType)) {
      pdfs.push(...(await collectPdfFilesRecursive(drive, child.id, depth + 1)));
    }
  }

  return pdfs;
}

async function syncYearFolderNode(
  supabase: DbClient,
  drive: DriveClient,
  siteYearFolderId: string,
  yearNode: DriveFileNode,
  examType: PassPaperExamType,
  medium: PassPaperMedium,
  year: number,
  options: DriveSyncOptions,
  existingByUrl: Map<string, { id: string; title: string; folder_id: string; published: boolean }>,
  report: DriveSyncReport
): Promise<void> {
  const folderUrl = driveUrlForNode(yearNode);
  await upsertDriveItem(
    supabase,
    {
      folderId: siteYearFolderId,
      title: `${year} Papers (Drive folder)`,
      driveUrl: folderUrl,
      year,
      medium,
      examType,
      published: options.publish ?? false,
    },
    existingByUrl,
    options.dryRun ?? false,
    report
  );

  if (!options.includeFiles) return;

  const files = await collectPdfFilesRecursive(drive, yearNode.id);
  for (const file of files) {
    const fileUrl = driveUrlForNode(file);
    await upsertDriveItem(
      supabase,
      {
        folderId: siteYearFolderId,
        title: file.name.replace(/\.pdf$/i, ""),
        driveUrl: fileUrl,
        year,
        medium,
        examType,
        published: options.publish ?? false,
      },
      existingByUrl,
      options.dryRun ?? false,
      report
    );
  }
}

async function syncMediumBranch(
  supabase: DbClient,
  drive: DriveClient,
  folders: PassPaperFolder[],
  examRoot: PassPaperFolder,
  mediumNode: DriveFileNode,
  examType: PassPaperExamType,
  medium: PassPaperMedium,
  options: DriveSyncOptions,
  existingByUrl: Map<string, { id: string; title: string; folder_id: string; published: boolean }>,
  report: DriveSyncReport
): Promise<void> {
  const mediumSlug = MEDIUM_SLUGS[medium];
  const siteMedium = findChildFolder(folders, examRoot.id, mediumSlug);
  if (!siteMedium) {
    report.unmatched.push({
      driveName: mediumNode.name,
      driveUrl: driveUrlForNode(mediumNode),
      reason: `Site medium folder missing: ${examRoot.slug}/${mediumSlug}`,
    });
    return;
  }

  const children = await listDriveChildren(drive, mediumNode.id);

  for (const child of children) {
    if (isDriveFolder(child.mimeType)) {
      const year = parseYearFromName(child.name);
      if (!year) {
        report.unmatched.push({
          driveName: child.name,
          driveUrl: driveUrlForNode(child),
          reason: "Could not parse year from folder name",
        });
        continue;
      }

      const ensured = await ensureYearFolder(supabase, folders, siteMedium.id, year, options.dryRun ?? false);
      if (ensured.created) report.foldersEnsured += 1;

      const siteYearFolder = ensured.folder ?? findChildFolder(folders, siteMedium.id, String(year));
      if (!siteYearFolder) {
        report.unmatched.push({
          driveName: child.name,
          driveUrl: driveUrlForNode(child),
          reason: `Year folder ${year} could not be resolved on site`,
        });
        continue;
      }

      await syncYearFolderNode(
        supabase,
        drive,
        siteYearFolder.id,
        child,
        examType,
        medium,
        year,
        options,
        existingByUrl,
        report
      );
      continue;
    }

    if (isPdfFile(child)) {
      const year = parseYearFromName(child.name) ?? undefined;
      const fileUrl = driveUrlForNode(child);
      await upsertDriveItem(
        supabase,
        {
          folderId: siteMedium.id,
          title: child.name.replace(/\.pdf$/i, ""),
          driveUrl: fileUrl,
          year,
          medium,
          examType,
          published: options.publish ?? false,
        },
        existingByUrl,
        options.dryRun ?? false,
        report
      );
    }
  }
}

async function syncExamBranch(
  supabase: DbClient,
  drive: DriveClient,
  folders: PassPaperFolder[],
  examNode: DriveFileNode,
  examType: PassPaperExamType,
  options: DriveSyncOptions,
  existingByUrl: Map<string, { id: string; title: string; folder_id: string; published: boolean }>,
  report: DriveSyncReport
): Promise<void> {
  const examSlug = EXAM_ROOT_SLUGS[examType];
  const examRoot = findChildFolder(folders, null, examSlug);
  if (!examRoot) {
    report.unmatched.push({
      driveName: examNode.name,
      driveUrl: driveUrlForNode(examNode),
      reason: `Site exam root missing: ${examSlug}`,
    });
    return;
  }

  const children = await listDriveChildren(drive, examNode.id);
  for (const child of children) {
    if (!isDriveFolder(child.mimeType)) continue;
    const medium = parseMedium(child.name);
    if (!medium) {
      report.unmatched.push({
        driveName: child.name,
        driveUrl: driveUrlForNode(child),
        reason: "Could not detect medium (English/Sinhala/Tamil)",
      });
      continue;
    }
    await syncMediumBranch(
      supabase,
      drive,
      folders,
      examRoot,
      child,
      examType,
      medium,
      options,
      existingByUrl,
      report
    );
  }
}

export async function syncPassPapersFromDriveInternal(
  supabase: DbClient,
  options: DriveSyncOptions
): Promise<DriveSyncReport> {
  const rootId = extractDriveResourceId(options.rootUrl);
  if (!rootId) {
    throw new Error("Invalid Google Drive root URL");
  }

  const allowedExams = new Set(options.examTypes ?? ["al", "ol"]);
  const drive = await createDriveClient();
  const folders = await loadAllFolders(supabase);
  const report: DriveSyncReport = {
    scanned: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    foldersEnsured: 0,
    unmatched: [],
  };

  const rootChildren = await listDriveChildren(drive, rootId);
  const existingByUrl = await loadAllItemsByDriveUrl(supabase);

  for (const child of rootChildren) {
    if (!isDriveFolder(child.mimeType)) continue;
    const examType = parseExamType(child.name);
    if (!examType || (examType !== "al" && examType !== "ol")) {
      report.unmatched.push({
        driveName: child.name,
        driveUrl: driveUrlForNode(child),
        reason: "Not recognized as A/L or O/L exam root",
      });
      continue;
    }
    if (!allowedExams.has(examType)) continue;

    await syncExamBranch(supabase, drive, folders, child, examType, options, existingByUrl, report);
  }

  return report;
}
