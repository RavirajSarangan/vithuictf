"use client";

import { Badge } from "@/components/ui/badge";
import { SESSION_STATUS_LABELS } from "@/lib/academics/constants";
import type { ClassSessionStatus } from "@/types";
import { cn } from "@/lib/utils";

const VARIANTS: Record<ClassSessionStatus, "default" | "secondary" | "outline"> = {
  scheduled: "secondary",
  completed: "default",
  cancelled: "outline",
};

interface SessionStatusBadgeProps {
  status: ClassSessionStatus;
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  return (
    <Badge variant={VARIANTS[status]} className={cn("capitalize", className)}>
      {SESSION_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
