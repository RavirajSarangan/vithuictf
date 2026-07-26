import type { SelectionInsight } from "@/components/admin/selection-insights-panel";
import type { SummaryCardItem } from "@/components/admin/table-summary-cards";
import type { Student, Course, ContactInquiry } from "@/types";

export function countByField<T>(
  rows: T[],
  getValue: (row: T) => string | number | boolean | null | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const raw = getValue(row);
    const key = raw == null || raw === "" ? "—" : String(raw);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function insightsFromCounts(
  counts: Record<string, number>,
  limit = 4
): SelectionInsight[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export interface StudentOverviewRow {
  student: Student;
  enrollmentCount: number;
}

export function studentTableSummary(rows: StudentOverviewRow[]): SummaryCardItem[] {
  const pending = rows.filter(
    (r) => (r.student.registrationStatus ?? "approved") === "pending"
  ).length;
  const active = rows.filter((r) => r.student.active !== false).length;
  const multiCourse = rows.filter((r) => r.enrollmentCount > 1).length;
  return [
    { label: "Total", value: rows.length },
    { label: "Pending", value: pending, variant: pending > 0 ? "warning" : "default" },
    { label: "Active", value: active, variant: "success" },
    { label: "Multi-course", value: multiCourse },
  ];
}

export function studentSelectionInsights(rows: StudentOverviewRow[]): SelectionInsight[] {
  const pending = rows.filter(
    (r) => (r.student.registrationStatus ?? "approved") === "pending"
  ).length;
  const approved = rows.length - pending;
  const inactive = rows.filter((r) => r.student.active === false).length;
  const courses = new Set(rows.map((r) => r.student.courseName).filter(Boolean));
  return [
    { label: "Approved", value: approved },
    { label: "Pending", value: pending },
    { label: "Inactive", value: inactive },
    { label: "Courses", value: courses.size },
  ];
}

export function studentListSummary(students: Student[]): SummaryCardItem[] {
  const pending = students.filter(
    (s) => (s.registrationStatus ?? "approved") === "pending"
  ).length;
  const active = students.filter((s) => s.active !== false).length;
  const disabled = students.length - active;
  return [
    { label: "Total", value: students.length },
    { label: "Pending", value: pending, variant: pending > 0 ? "warning" : "default" },
    { label: "Active", value: active, variant: "success" },
    { label: "Disabled", value: disabled },
  ];
}

export function studentListSelectionInsights(students: Student[]): SelectionInsight[] {
  const pending = students.filter(
    (s) => (s.registrationStatus ?? "approved") === "pending"
  ).length;
  const active = students.filter((s) => s.active !== false).length;
  const courses = new Set(students.map((s) => s.courseName).filter(Boolean));
  return [
    { label: "Active", value: active },
    { label: "Pending", value: pending },
    { label: "Courses", value: courses.size },
  ];
}

export function courseTableSummary(courses: Course[]): SummaryCardItem[] {
  const categories = new Set(courses.map((c) => c.category).filter(Boolean));
  const students = courses.reduce((sum, c) => sum + (c.studentCount ?? 0), 0);
  return [
    { label: "Total", value: courses.length },
    { label: "Categories", value: categories.size },
    { label: "Students", value: students },
  ];
}

export function courseSelectionInsights(courses: Course[]): SelectionInsight[] {
  return insightsFromCounts(
    countByField(courses, (c) => c.category ?? "—")
  );
}

export function inquiryTableSummary(inquiries: ContactInquiry[]): SummaryCardItem[] {
  const unread = inquiries.filter((i) => i.status === "new").length;
  const read = inquiries.filter((i) => i.status === "read").length;
  return [
    { label: "Total", value: inquiries.length },
    { label: "New", value: unread, variant: unread > 0 ? "warning" : "default" },
    { label: "Read", value: read },
  ];
}

export function inquirySelectionInsights(inquiries: ContactInquiry[]): SelectionInsight[] {
  return insightsFromCounts(countByField(inquiries, (i) => i.status));
}

export function genericTableSummary(
  rows: unknown[],
  label = "Total"
): SummaryCardItem[] {
  return [{ label, value: rows.length }];
}

export function resourceTableSummary(
  resources: { category?: string; type?: string }[]
): SummaryCardItem[] {
  const categories = new Set(resources.map((r) => r.category).filter(Boolean));
  return [
    { label: "Total", value: resources.length },
    { label: "Categories", value: categories.size },
    {
      label: "PDF",
      value: resources.filter((r) => r.type === "pdf").length,
    },
    {
      label: "Video",
      value: resources.filter((r) => r.type === "video").length,
    },
  ];
}

export function resourceSelectionInsights(
  resources: { category?: string; type?: string }[]
): SelectionInsight[] {
  return [
    ...insightsFromCounts(countByField(resources, (r) => r.category ?? "—"), 2),
    ...insightsFromCounts(countByField(resources, (r) => r.type ?? "—"), 2),
  ].slice(0, 4);
}

export function resultTableSummary(
  results: { subject?: string; grade?: string }[]
): SummaryCardItem[] {
  const subjects = new Set(results.map((r) => r.subject).filter(Boolean));
  return [
    { label: "Total", value: results.length },
    { label: "Subjects", value: subjects.size },
  ];
}

export function resultSelectionInsights(
  results: { subject?: string; grade?: string }[]
): SelectionInsight[] {
  return [
    ...insightsFromCounts(countByField(results, (r) => r.subject ?? "—"), 2),
    ...insightsFromCounts(countByField(results, (r) => r.grade ?? "—"), 2),
  ].slice(0, 4);
}

export function categoryTableSummary(
  categories: { active?: boolean }[]
): SummaryCardItem[] {
  const active = categories.filter((c) => c.active !== false).length;
  return [
    { label: "Total", value: categories.length },
    { label: "Active", value: active, variant: "success" },
    { label: "Inactive", value: categories.length - active },
  ];
}

export function categorySelectionInsights(
  categories: { active?: boolean }[]
): SelectionInsight[] {
  return insightsFromCounts(
    countByField(categories, (c) => (c.active !== false ? "Active" : "Inactive"))
  );
}

export function genericSelectionInsights(
  rows: unknown[],
  getLabel?: (row: unknown) => string
): SelectionInsight[] {
  if (!getLabel || rows.length === 0) return [];
  return insightsFromCounts(
    countByField(rows, (row) => getLabel(row))
  );
}

export function peopleTableSummary(
  entries: { role: string; active?: boolean }[]
): SummaryCardItem[] {
  const active = entries.filter((e) => e.active !== false).length;
  return [
    { label: "Total", value: entries.length },
    { label: "Active", value: active, variant: "success" },
    { label: "Inactive", value: entries.length - active },
  ];
}

export function peopleTabCountsSummary(
  entries: { role: string }[]
): SummaryCardItem[] {
  return [
    { label: "Staff", value: entries.filter((e) => e.role === "teacher").length },
    {
      label: "Admins",
      value: entries.filter((e) => e.role === "admin" || e.role === "super_admin").length,
    },
    { label: "Content", value: entries.filter((e) => e.role === "content_manager").length },
    { label: "Paper center", value: entries.filter((e) => e.role === "paper_center_staff").length },
    { label: "Faculty", value: entries.filter((e) => e.role === "faculty_staff").length },
  ];
}

export function peopleSelectionInsights(
  entries: { role: string; active?: boolean }[]
): SelectionInsight[] {
  return [
    ...insightsFromCounts(countByField(entries, (e) => e.role), 3),
    { label: "Active", value: entries.filter((e) => e.active !== false).length },
  ];
}

export function paperCenterTableSummary(
  centers: { isActive?: boolean; grades?: string[] }[]
): SummaryCardItem[] {
  const active = centers.filter((c) => c.isActive !== false).length;
  return [
    { label: "Total", value: centers.length },
    { label: "Active", value: active, variant: "success" },
    { label: "Inactive", value: centers.length - active },
  ];
}

export function paperCenterSelectionInsights(
  centers: { district?: string; isActive?: boolean }[]
): SelectionInsight[] {
  return [
    ...insightsFromCounts(countByField(centers, (c) => c.district ?? "—"), 2),
    {
      label: "Active",
      value: centers.filter((c) => c.isActive !== false).length,
    },
  ];
}

export function parentTableSummary(parents: unknown[]): SummaryCardItem[] {
  return genericTableSummary(parents, "Parents");
}

export function paymentTableSummary(
  payments: { status?: string; amount?: number }[]
): SummaryCardItem[] {
  const paid = payments.filter((p) => p.status === "paid").length;
  const total = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  return [
    { label: "Total", value: payments.length },
    { label: "Paid", value: paid, variant: "success" },
    { label: "Pending", value: payments.filter((p) => p.status === "pending").length },
    { label: "Amount (LKR)", value: total.toLocaleString() },
  ];
}

export function paymentSelectionInsights(
  payments: { status?: string; method?: string }[]
): SelectionInsight[] {
  return [
    ...insightsFromCounts(countByField(payments, (p) => p.status ?? "—"), 2),
    ...insightsFromCounts(countByField(payments, (p) => p.method ?? "—"), 2),
  ].slice(0, 4);
}

export function batchTableSummary(
  batches: { active?: boolean }[]
): SummaryCardItem[] {
  const active = batches.filter((b) => b.active !== false).length;
  return [
    { label: "Total", value: batches.length },
    { label: "Active", value: active, variant: "success" },
    { label: "Archived", value: batches.length - active },
  ];
}

export function batchSelectionInsights(
  batches: { courseName?: string; active?: boolean }[]
): SelectionInsight[] {
  return [
    ...insightsFromCounts(countByField(batches, (b) => b.courseName ?? "—"), 2),
    { label: "Active", value: batches.filter((b) => b.active !== false).length },
  ];
}

export function calendarSessionTableSummary(
  sessions: { sessionType?: string }[]
): SummaryCardItem[] {
  const recurring = sessions.filter((s) => s.sessionType === "recurring").length;
  return [
    { label: "Total", value: sessions.length },
    { label: "Recurring", value: recurring },
    { label: "One-off", value: sessions.length - recurring },
  ];
}

export function blogPostTableSummary(
  posts: { status?: string }[]
): SummaryCardItem[] {
  const published = posts.filter((p) => p.status === "published").length;
  return [
    { label: "Total", value: posts.length },
    { label: "Published", value: published, variant: "success" },
    { label: "Draft", value: posts.length - published },
  ];
}

export function blogPostSelectionInsights(
  posts: { status?: string; categoryName?: string }[]
): SelectionInsight[] {
  return [
    ...insightsFromCounts(countByField(posts, (p) => p.status ?? "—"), 2),
    ...insightsFromCounts(countByField(posts, (p) => p.categoryName ?? "—"), 2),
  ].slice(0, 4);
}

export function blogCategoryTableSummary(
  categories: { isActive?: boolean }[]
): SummaryCardItem[] {
  const active = categories.filter((c) => c.isActive !== false).length;
  return [
    { label: "Total", value: categories.length },
    { label: "Active", value: active, variant: "success" },
    { label: "Inactive", value: categories.length - active },
  ];
}

export function blogCategorySelectionInsights(
  categories: { isActive?: boolean }[]
): SelectionInsight[] {
  return insightsFromCounts(
    countByField(categories, (c) => (c.isActive !== false ? "Active" : "Inactive"))
  );
}

export function announcementTableSummary(
  announcements: { isActive?: boolean }[]
): SummaryCardItem[] {
  const active = announcements.filter((a) => a.isActive !== false).length;
  return [
    { label: "Total", value: announcements.length },
    { label: "Active", value: active, variant: "success" },
    { label: "Inactive", value: announcements.length - active },
  ];
}

export function headlineNewsTableSummary(
  items: { isActive?: boolean }[]
): SummaryCardItem[] {
  const active = items.filter((i) => i.isActive !== false).length;
  return [
    { label: "Total", value: items.length },
    { label: "Active", value: active, variant: "success" },
    { label: "Inactive", value: items.length - active },
  ];
}

export function passPaperItemTableSummary(
  items: { published?: boolean }[]
): SummaryCardItem[] {
  const published = items.filter((i) => i.published).length;
  return [
    { label: "Total", value: items.length },
    { label: "Published", value: published, variant: "success" },
    { label: "Draft", value: items.length - published },
  ];
}

export function examPaperBatchTableSummary(
  batches: { paperCount?: number }[]
): SummaryCardItem[] {
  const papers = batches.reduce((sum, b) => sum + (b.paperCount ?? 0), 0);
  return [
    { label: "Batches", value: batches.length },
    { label: "Papers", value: papers },
  ];
}

export function financeLedgerSummary(
  charges: { status?: string; amountLkr?: number }[]
): SummaryCardItem[] {
  const pending = charges.filter((c) => c.status === "pending").length;
  const total = charges.reduce((sum, c) => sum + (c.amountLkr ?? 0), 0);
  return [
    { label: "Charges", value: charges.length },
    { label: "Pending", value: pending, variant: pending > 0 ? "warning" : "default" },
    { label: "Total (LKR)", value: total.toLocaleString() },
  ];
}

export function attendanceReportSummary(
  rows: { attendancePercent?: number }[]
): SummaryCardItem[] {
  const low = rows.filter((r) => (r.attendancePercent ?? 0) < 75).length;
  return [
    { label: "Students", value: rows.length },
    { label: "Below 75%", value: low, variant: low > 0 ? "warning" : "default" },
  ];
}

export function absenteeSelectionInsights(
  rows: { attendancePercent: number; absent: number }[]
): SelectionInsight[] {
  const avgPercent = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.attendancePercent, 0) / rows.length)
    : 0;
  const totalAbsences = rows.reduce((s, r) => s + r.absent, 0);
  return [
    { label: "Avg attendance %", value: avgPercent },
    { label: "Total absences", value: totalAbsences },
  ];
}

export function courseGrowthTableSummary(
  rows: { deltaEnrollments: number }[]
): SummaryCardItem[] {
  const gaining = rows.filter((r) => r.deltaEnrollments > 0).length;
  const declining = rows.filter((r) => r.deltaEnrollments < 0).length;
  return [
    { label: "Courses", value: rows.length },
    { label: "Gaining", value: gaining, variant: "success" },
    { label: "Declining", value: declining, variant: declining > 0 ? "warning" : "default" },
    { label: "Flat", value: rows.length - gaining - declining },
  ];
}

export function courseGrowthSelectionInsights(
  rows: { courseName: string; deltaEnrollments: number }[]
): SelectionInsight[] {
  const totalDelta = rows.reduce((s, r) => s + r.deltaEnrollments, 0);
  return [
    { label: "Net delta", value: totalDelta },
    ...insightsFromCounts(countByField(rows, (r) => r.courseName), 3),
  ];
}

/** Show toast message from bulk delete result */
export function formatBulkDeleteToast(
  result: { deleted: string[]; failed: { id: string; message: string }[] },
  entityLabel: string
): { type: "success" | "warning" | "error"; message: string } {
  const { deleted, failed } = result;
  const plural = deleted.length === 1 ? entityLabel : `${entityLabel}s`;

  if (deleted.length > 0 && failed.length === 0) {
    return { type: "success", message: `Deleted ${deleted.length} ${plural}` };
  }
  if (deleted.length > 0 && failed.length > 0) {
    return {
      type: "warning",
      message: `Deleted ${deleted.length} of ${deleted.length + failed.length} — ${failed.length} failed`,
    };
  }
  return {
    type: "error",
    message: failed[0]?.message ?? `Failed to delete ${entityLabel}`,
  };
}
