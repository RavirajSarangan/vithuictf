import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  buildFeeReminderEmailHtml,
  buildFeeReminderEmailSubject,
  buildFeeReminderEmailText,
} from "@/lib/email/templates/fee-reminder";

export type FeeReminderStats = {
  studentsWithDues: number;
  remindersSent: number;
  emailsSent: number;
  skippedAlreadyReminded: number;
};

type StudentDues = {
  studentId: string;
  userId: string | null;
  displayName: string;
  email: string | null;
  notifyEmail: boolean;
  active: boolean;
  totalLkr: number;
  courses: Map<string, { courseName: string; outstandingLkr: number }>;
};

function currentBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Send at most one fee-due reminder per student per calendar month
 * (portal notification + email). Shared by the cron route and the
 * admin "send now" action.
 */
export async function runFeeReminders(): Promise<FeeReminderStats> {
  const supabase = createAdminClient();
  const month = currentBillingMonth();
  const stats: FeeReminderStats = {
    studentsWithDues: 0,
    remindersSent: 0,
    emailsSent: 0,
    skippedAlreadyReminded: 0,
  };

  const { data: charges, error } = await supabase
    .from("session_charges")
    .select(
      "student_id, course_id, amount_lkr, courses(name), students(id, user_id, display_name, email, notify_email, active)"
    )
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  const byStudent = new Map<string, StudentDues>();
  for (const row of charges ?? []) {
    const studentRaw = row.students as unknown;
    const student = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as {
      id: string;
      user_id: string | null;
      display_name: string;
      email: string | null;
      notify_email: boolean;
      active: boolean;
    } | null;
    if (!student) continue;

    const courseRaw = row.courses as unknown;
    const course = (Array.isArray(courseRaw) ? courseRaw[0] : courseRaw) as { name: string } | null;

    let entry = byStudent.get(row.student_id);
    if (!entry) {
      entry = {
        studentId: student.id,
        userId: student.user_id,
        displayName: student.display_name,
        email: student.email,
        notifyEmail: student.notify_email !== false,
        active: student.active !== false,
        totalLkr: 0,
        courses: new Map(),
      };
      byStudent.set(row.student_id, entry);
    }

    const amount = Number(row.amount_lkr);
    entry.totalLkr += amount;
    const courseName = course?.name ?? "Course";
    const courseEntry = entry.courses.get(row.course_id);
    if (courseEntry) courseEntry.outstandingLkr += amount;
    else entry.courses.set(row.course_id, { courseName, outstandingLkr: amount });
  }

  stats.studentsWithDues = byStudent.size;
  if (!byStudent.size) return stats;

  const { data: logged } = await supabase
    .from("fee_reminder_log")
    .select("student_id")
    .eq("billing_month", month);
  const alreadyReminded = new Set((logged ?? []).map((r) => r.student_id));

  for (const dues of byStudent.values()) {
    if (!dues.active || dues.totalLkr <= 0) continue;
    if (alreadyReminded.has(dues.studentId)) {
      stats.skippedAlreadyReminded += 1;
      continue;
    }

    const courses = Array.from(dues.courses.values());
    const title = "Class fee reminder";
    const body = `You have Rs. ${dues.totalLkr.toLocaleString()} in outstanding class fees. See Payments for the breakdown.`;

    let channel = "";
    if (dues.userId) {
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: dues.userId,
        title,
        body,
        type: "announcement" as const,
        metadata: { kind: "fee_due", outstandingLkr: dues.totalLkr, billingMonth: month },
      });
      if (!notifyError) channel = "portal";
    }

    if (dues.email && dues.notifyEmail) {
      const emailData = { name: dues.displayName, outstandingLkr: dues.totalLkr, courses };
      const result = await sendEmail({
        to: dues.email,
        subject: buildFeeReminderEmailSubject(emailData),
        html: buildFeeReminderEmailHtml(emailData),
        text: buildFeeReminderEmailText(emailData),
      });
      if (result.emailSent) {
        channel = channel ? `${channel}+email` : "email";
        stats.emailsSent += 1;
      }
    }

    if (!channel) continue;

    const { error: logError } = await supabase.from("fee_reminder_log").insert({
      student_id: dues.studentId,
      billing_month: month,
      outstanding_lkr: dues.totalLkr,
      channel,
    });
    if (logError && !logError.message.includes("duplicate")) {
      console.error("[fee-reminders] failed to log reminder:", logError.message);
    }
    stats.remindersSent += 1;
  }

  return stats;
}
