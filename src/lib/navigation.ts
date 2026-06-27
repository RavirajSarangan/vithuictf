import {
  LayoutDashboard, BarChart3, BookOpen, Trophy, Medal, Brain, Settings, IdCard,
  Users, GraduationCap, FileText, Bell, CreditCard, Award, LineChart, UserCheck, CalendarDays, Tags, Mail,
} from "lucide-react";
import type { NavItem } from "@/components/layout/portal-shell";

export const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/achievements", label: "Achievements", icon: Medal },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile-card", label: "Profile Card", icon: IdCard },
  { href: "/ai-assistant", label: "AI Assistant", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const parentNav: NavItem[] = [
  { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/parent/performance", label: "Performance", icon: BarChart3 },
  { href: "/parent/notifications", label: "Notifications", icon: Bell },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/parents", label: "Parents", icon: UserCheck },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/results", label: "Results", icon: FileText },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/home", label: "Home Content", icon: Settings },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
  { href: "/admin/inquiries", label: "Inquiries", icon: Mail },
];
