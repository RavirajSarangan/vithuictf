"use client";

import Link from "next/link";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  MapPin,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types";

type QuickAction = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const ACTIONS: QuickAction[] = [
  {
    label: "Add Student",
    href: "/admin/students",
    icon: UserPlus,
    roles: ["admin", "super_admin"],
  },
  {
    label: "Record Payment",
    href: "/admin/payments",
    icon: CreditCard,
    roles: ["admin", "super_admin"],
  },
  {
    label: "Issue Certificate",
    href: "/admin/certificates",
    icon: Award,
    roles: ["admin", "super_admin", "teacher"],
  },
  {
    label: "Send Notification",
    href: "/admin/notifications",
    icon: Bell,
    roles: ["admin", "super_admin"],
  },
  {
    label: "View Inquiries",
    href: "/admin/inquiries",
    icon: FileText,
    roles: ["admin", "super_admin"],
  },
  {
    label: "Academics",
    href: "/academics/dashboard",
    icon: GraduationCap,
    roles: ["teacher", "admin", "super_admin"],
  },
  {
    label: "Calendar",
    href: "/admin/calendar",
    icon: CalendarDays,
    roles: ["teacher", "admin", "super_admin"],
  },
  {
    label: "My Students",
    href: "/admin/students",
    icon: Users,
    roles: ["teacher"],
  },
  {
    label: "Attendance",
    href: "/academics/attendance",
    icon: ClipboardCheck,
    roles: ["teacher"],
  },
  {
    label: "Pass Papers",
    href: "/admin/pass-papers",
    icon: FolderOpen,
    roles: ["super_admin"],
  },
  {
    label: "Exam Papers",
    href: "/admin/exam-papers",
    icon: FileText,
    roles: ["super_admin"],
  },
  {
    label: "Paper Centers",
    href: "/admin/paper-centers",
    icon: MapPin,
    roles: ["super_admin"],
  },
  {
    label: "Courses",
    href: "/admin/courses",
    icon: BookOpen,
    roles: ["teacher"],
  },
];

interface DashboardQuickActionsProps {
  role: UserRole;
}

export function DashboardQuickActions({ role }: DashboardQuickActionsProps) {
  const visible = ACTIONS.filter((a) => a.roles.includes(role));

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="sm"
          className="gap-1.5"
          render={<Link href={action.href} />}
        >
          <action.icon className="size-3.5" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
