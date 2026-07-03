import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Batches have been folded into courses — resolve the batch to its course and
// forward to the per-course detail page.
export default async function AcademicsBatchDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: batch } = await supabase
    .from("course_batches")
    .select("course_id")
    .eq("id", id)
    .maybeSingle();

  if (batch?.course_id) {
    redirect(`/academics/courses/${batch.course_id}`);
  }
  redirect("/admin/courses");
}
