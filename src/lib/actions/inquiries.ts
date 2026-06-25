"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";

export async function updateInquiryStatus(id: string, status: "read" | "replied") {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("contact_inquiries").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAdminAction("inquiry.update", "contact_inquiry", id, { status });
  revalidatePath("/admin/inquiries");
}
