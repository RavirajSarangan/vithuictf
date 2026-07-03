import { NextResponse } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  buildBirthdayWishEmailHtml,
  buildBirthdayWishEmailSubject,
  buildBirthdayWishEmailText,
} from "@/lib/email/templates/birthday-wish";

const COLOMBO_TZ = "Asia/Colombo";

// Returns YYYY-MM-DD for the current calendar date in Sri Lanka.
function colomboTodayStr(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const today = colomboTodayStr();
  const [yearStr, monthStr, dayStr] = today.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const { data: members, error } = await supabase
    .from("ictf_team_members")
    .select("id, name, role, email, date_of_birth, last_birthday_wish_sent")
    .not("date_of_birth", "is", null)
    .neq("email", "");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const member of members ?? []) {
    if (!member.date_of_birth || !member.email) continue;
    const [, birthMonthStr, birthDayStr] = member.date_of_birth.split("-");
    const birthMonth = Number(birthMonthStr);
    const birthDay = Number(birthDayStr);

    const isBirthday =
      (birthMonth === month && birthDay === day) ||
      // Feb-29 birthdays are greeted on Feb 28 in non-leap years.
      (birthMonth === 2 && birthDay === 29 && month === 2 && day === 28 && !isLeapYear(year));
    if (!isBirthday) continue;
    if (member.last_birthday_wish_sent === today) continue;

    const emailData = { name: member.name, role: member.role };
    const result = await sendEmail({
      to: member.email,
      subject: buildBirthdayWishEmailSubject(emailData),
      html: buildBirthdayWishEmailHtml(emailData),
      text: buildBirthdayWishEmailText(emailData),
    });

    if (result.emailSent) {
      sent += 1;
      await supabase
        .from("ictf_team_members")
        .update({ last_birthday_wish_sent: today })
        .eq("id", member.id);
    } else {
      failures.push({ id: member.id, error: result.error ?? "Unknown send failure" });
    }
  }

  return NextResponse.json({
    date: today,
    checked: members?.length ?? 0,
    sent,
    failures,
  });
}
