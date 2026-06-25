"use client";

import { ProfileCardEditor } from "@/components/student/profile-card-editor";
import {
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { useStudentData } from "@/hooks/use-data";

export default function ProfileCardPage() {
  const student = useStudentData();

  if (student === undefined) {
    return <StudentPageLoading rows={2} />;
  }

  if (!student) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Profile card"
        description="Create your flip card, add a photo and bio, then share it on social media."
      />
      <ProfileCardEditor student={student} />
    </div>
  );
}
