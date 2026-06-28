import {
  LayoutDashboard, BarChart3, BookOpen, Trophy, Medal, Brain, Settings, IdCard,
  Users, GraduationCap, FileText, Bell, CreditCard, Award, LineChart, UserCheck, CalendarDays, Tags, Mail, Share2, Clapperboard,
  FolderOpen, ClipboardCheck, Layers, MapPin,
} from "lucide-react";
import type { NavItem } from "@/components/layout/portal-shell";

export const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/pass-papers", label: "Pass Papers", icon: FolderOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/achievements", label: "Achievements", icon: Medal },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile-card", label: "Profile Card", icon: IdCard },
  { href: "/ai-assistant", label: "AI Assistant", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const parentNav: NavItem[] = [
  { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/parent/pass-papers", label: "Pass Papers", icon: FolderOpen },
  { href: "/parent/performance", label: "Performance", icon: BarChart3 },
  { href: "/parent/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/parent/notifications", label: "Notifications", icon: Bell },
];

export const paperCenterNav: NavItem[] = [
  { href: "/paper-center/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/paper-center/upload", label: "Upload", icon: FileText },
  { href: "/paper-center/history", label: "History", icon: ClipboardCheck },
];

export const staffNav: NavItem[] = [
  { href: "/staff/tracking", label: "Tracking", icon: Clapperboard },
  { href: "/staff/courses", label: "Courses", icon: BookOpen },
];

export const academicsNav: NavItem[] = [
  { href: "/academics/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academics/students", label: "Students", icon: Users },
  { href: "/academics/batches", label: "Batches", icon: Layers },
  { href: "/academics/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/academics/reports", label: "Reports", icon: LineChart },
  { href: "/academics/calendar", label: "Calendar", icon: CalendarDays },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academics/dashboard", label: "Academics", icon: GraduationCap },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/people", label: "People", icon: GraduationCap },
  { href: "/admin/parents", label: "Parents", icon: UserCheck },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/results", label: "Results", icon: FileText },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/pass-papers", label: "Pass Papers", icon: FolderOpen },
  { href: "/admin/exam-papers", label: "Exam Papers", icon: FileText },
  { href: "/admin/paper-centers", label: "Paper Centers", icon: MapPin },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/home", label: "Home Content", icon: Settings },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
  { href: "/admin/social-tracking", label: "Social Tracking", icon: Share2 },
  { href: "/admin/inquiries", label: "Inquiries", icon: Mail },
];
