"use server";

import {
  deleteStudent,
  deleteCourse,
  deleteResource,
  deleteResult,
  deleteStaffMember,
  deleteAdmin,
  deleteCompany,
  deleteClassProgram,
  deletePaperCenter,
  deleteFeaturedRanking,
  deleteMarketingAnnouncement,
  deleteHeadlineNews,
  deleteBlogCategory,
  deleteBlogPost,
} from "@/lib/actions/admin";
import { deleteContentManager } from "@/lib/actions/content-team";
import { deleteManagedPaperCenter } from "@/lib/actions/paper-centers";
import { deletePaperCenterStaff } from "@/lib/actions/paper-center-staff";
import { deleteFacultyStaff } from "@/lib/actions/faculty-staff";
import { deleteExamPaperBatch } from "@/lib/actions/exam-papers";
import { deletePassPaperFolder, deletePassPaperItem } from "@/lib/actions/pass-papers";
import { deleteSubjectCategory, deleteCalendarSession } from "@/lib/actions/calendar";
import { toActionError } from "@/lib/actions/action-error";

export interface BulkDeleteResult {
  deleted: string[];
  failed: { id: string; message: string }[];
}

async function runBulkDelete(
  ids: string[],
  deleteFn: (id: string) => Promise<unknown>
): Promise<BulkDeleteResult> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const results = await Promise.allSettled(uniqueIds.map((id) => deleteFn(id)));

  const deleted: string[] = [];
  const failed: { id: string; message: string }[] = [];

  results.forEach((result, index) => {
    const id = uniqueIds[index]!;
    if (result.status === "fulfilled") {
      deleted.push(id);
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : toActionError(result.reason, "Delete failed").message;
      failed.push({ id, message });
    }
  });

  return { deleted, failed };
}

export async function bulkDeleteStudents(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteStudent);
}

export async function bulkDeleteCourses(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteCourse);
}

export async function bulkDeleteResources(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteResource);
}

export async function bulkDeleteResults(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteResult);
}

export async function bulkDeleteStaffMembers(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteStaffMember);
}

export async function bulkDeleteAdmins(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteAdmin);
}

export async function bulkDeleteContentManagers(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteContentManager);
}

export async function bulkDeleteManagedPaperCenters(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteManagedPaperCenter);
}

export async function bulkDeleteBlogPosts(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteBlogPost);
}

export async function bulkDeleteBlogCategories(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteBlogCategory);
}

export async function bulkDeleteSubjectCategories(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteSubjectCategory);
}

export async function bulkDeleteCalendarSessions(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteCalendarSession);
}

export async function bulkDeleteCompanies(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteCompany);
}

export async function bulkDeleteClassPrograms(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteClassProgram);
}

export async function bulkDeletePaperCenters(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deletePaperCenter);
}

export async function bulkDeleteFeaturedRankings(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteFeaturedRanking);
}

export async function bulkDeleteMarketingAnnouncements(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteMarketingAnnouncement);
}

export async function bulkDeleteHeadlineNews(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteHeadlineNews);
}

export async function bulkDeleteExamPaperBatches(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, deleteExamPaperBatch);
}

export async function bulkDeletePassPaperFolders(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, async (id) => {
    const result = await deletePassPaperFolder(id);
    if (!result.ok) throw new Error(result.error ?? "Delete failed");
  });
}

export async function bulkDeletePassPaperItems(ids: string[]): Promise<BulkDeleteResult> {
  return runBulkDelete(ids, async (id) => {
    const result = await deletePassPaperItem(id);
    if (!result.ok) throw new Error(result.error ?? "Delete failed");
  });
}

export type PeopleBulkEntry = {
  id: string;
  userId: string;
  role: "teacher" | "admin" | "super_admin" | "content_manager" | "paper_center_staff" | "faculty_staff";
};

export async function bulkDeletePeople(entries: PeopleBulkEntry[]): Promise<BulkDeleteResult> {
  const deleted: string[] = [];
  const failed: { id: string; message: string }[] = [];

  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      if (entry.role === "super_admin") {
        throw new Error("Super administrators cannot be removed");
      }
      if (entry.role === "teacher") await deleteStaffMember(entry.id);
      else if (entry.role === "admin") await deleteAdmin(entry.userId);
      else if (entry.role === "content_manager") await deleteContentManager(entry.id);
      else if (entry.role === "paper_center_staff") await deletePaperCenterStaff(entry.id);
      else if (entry.role === "faculty_staff") await deleteFacultyStaff(entry.id);
      else throw new Error("Unsupported role");
      return entry.id;
    })
  );

  results.forEach((result, index) => {
    const entry = entries[index]!;
    if (result.status === "fulfilled") {
      deleted.push(entry.id);
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : toActionError(result.reason, "Delete failed").message;
      failed.push({ id: entry.id, message });
    }
  });

  return { deleted, failed };
}
