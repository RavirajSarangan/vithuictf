import { Badge } from "@/components/ui/badge";
import type { RegistrationStatus } from "@/types";

const LABELS: Record<RegistrationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const VARIANTS: Record<RegistrationStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export function EnrollmentStatusBadge({
  status = "approved",
}: {
  status?: RegistrationStatus;
}) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
