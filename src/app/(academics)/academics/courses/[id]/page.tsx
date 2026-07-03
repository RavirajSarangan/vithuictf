import { redirect } from "next/navigation";
import { getOrCreateCourseBatch } from "@/lib/actions/academics";
import { CourseBatchDetail } from "@/components/academics/course-batch-detail";

export default async function AcademicsCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrCreateCourseBatch(id);
  if (!result.ok) {
    redirect("/admin/courses");
  }
  return <CourseBatchDetail batchId={result.data.batchId} />;
}
