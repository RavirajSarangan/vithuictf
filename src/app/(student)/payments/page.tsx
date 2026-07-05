"use client";

import { useStudentData } from "@/hooks/use-data";
import { useStudentBilling } from "@/hooks/use-student-data";
import { StudentPaymentsView } from "@/components/student/payments/student-payments-view";
import {
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";

export default function StudentPaymentsPage() {
  const student = useStudentData();
  const { summaries, charges, isLoading } = useStudentBilling(student?.id);

  if (student === undefined || isLoading) {
    return <StudentPageLoading rows={2} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Payments"
        description="Your class fees, payments, and outstanding balance."
      />
      <StudentPaymentsView summaries={summaries} charges={charges} />
    </div>
  );
}
