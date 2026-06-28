"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import { ExamPaperUploadForm } from "@/components/exam-papers/exam-paper-upload-form";
import { usePaperCenterStaffProfile } from "@/hooks/use-exam-papers";
import { useRouter } from "next/navigation";

export default function PaperCenterUploadPage() {
  const router = useRouter();
  const { staff, loading } = usePaperCenterStaffProfile();

  if (loading) {
    return <StudentPageLoading rows={2} />;
  }

  if (!staff) {
    return (
      <p className="text-sm text-destructive">
        Your paper center profile could not be loaded. Contact an administrator.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Upload Exam Papers"
        description="Submit scanned student exam papers for your paper center. Center and staff details are recorded automatically."
      />
      <ExamPaperUploadForm
        centerName={staff.paperCenterName ?? "Paper Center"}
        staffName={staff.displayName}
        place={staff.place ?? "—"}
        onSuccess={() => router.push("/paper-center/history")}
      />
    </div>
  );
}
