import {
  LayoutDashboard, BarChart3, BookOpen, Trophy, Medal, Brain, Settings, IdCard,
  Users, GraduationCap, FileText, Bell, CreditCard, Award, LineChart, UserCheck, CalendarDays, Tags, Mail, Share2, Clapperboard,
  FolderOpen, ClipboardCheck, Layers, MapPin, Megaphone, Wallet, FileCheck2, ListTodo,
} from "lucide-react";
import type { NavItem } from "@/components/layout/portal-shell";

export const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/past-papers", label: "Past Papers", icon: FolderOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/assignments", label: "Assignments", icon: FileText },
  { href: "/quizzes", label: "Quizzes", icon: Brain },
  { href: "/exams", label: "Exams", icon: FileCheck2 },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/achievements", label: "Achievements", icon: Medal },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile-card", label: "Profile Card", icon: IdCard },
  { href: "/ai-assistant", label: "AI Assistant", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const parentNav: NavItem[] = [
  { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/parent/past-papers", label: "Past Papers", icon: FolderOpen },
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
  { href: "/academics/tasks", label: "Tasks & notes", icon: ListTodo },
  { href: "/academics/enrollments", label: "Enrollments", icon: UserCheck },
  { href: "/academics/students", label: "Students", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: Layers },
  { href: "/academics/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/academics/announcements", label: "Announcements", icon: Megaphone },
  { href: "/academics/assignments", label: "Assignments", icon: FileText },
  { href: "/academics/quizzes", label: "Quizzes", icon: Brain },
  { href: "/academics/exams", label: "Exams", icon: FileText },
  { href: "/academics/report-cards", label: "Report cards", icon: Award },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
  { href: "/academics/reports", label: "Reports", icon: LineChart },
  { href: "/academics/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/academics/blog", label: "Blog", icon: FileText },
];

export const facultyNav: NavItem[] = [
  { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty/enrollments", label: "Enrollments", icon: UserCheck },
  { href: "/faculty/students", label: "Students", icon: Users },
  { href: "/faculty/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/faculty/announcements", label: "Announcements", icon: Megaphone },
  { href: "/faculty/assignments", label: "Assignments", icon: FileText },
  { href: "/faculty/quizzes", label: "Quizzes", icon: Brain },
  { href: "/faculty/exams", label: "Exams", icon: FileText },
  { href: "/faculty/report-cards", label: "Report cards", icon: Award },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tasks", label: "Tasks & notes", icon: ListTodo },
  { href: "/academics/dashboard", label: "Academics", icon: GraduationCap, group: "Academics" },
  { href: "/academics/attendance", label: "Class attendance", icon: ClipboardCheck, group: "Academics" },
  { href: "/academics/announcements", label: "Announcements", icon: Megaphone, group: "Academics" },
  { href: "/academics/assignments", label: "Assignments", icon: FileText, group: "Academics" },
  { href: "/academics/quizzes", label: "Quizzes", icon: Brain, group: "Academics" },
  { href: "/academics/exams", label: "Exams", icon: FileText, group: "Academics" },
  { href: "/academics/report-cards", label: "Report cards", icon: Award, group: "Academics" },
  { href: "/academics/calendar", label: "Class calendar", icon: CalendarDays, group: "Academics" },
  { href: "/admin/students", label: "Students", icon: Users, group: "People" },
  { href: "/admin/people", label: "People", icon: GraduationCap, group: "People" },
  { href: "/admin/parents", label: "Parents", icon: UserCheck, group: "People" },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, group: "Learning" },
  { href: "/admin/categories", label: "Categories", icon: Tags, group: "Learning" },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays, group: "Learning" },
  { href: "/admin/results", label: "Results", icon: FileText, group: "Learning" },
  { href: "/admin/resources", label: "Resources", icon: BookOpen, group: "Learning" },
  { href: "/admin/past-papers", label: "Past Papers", icon: FolderOpen, group: "Learning" },
  { href: "/admin/exam-papers", label: "Exam Papers", icon: FileText, group: "Learning" },
  { href: "/admin/paper-centers", label: "Paper Centers", icon: MapPin, group: "Operations" },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, group: "Operations" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, group: "Operations" },
  { href: "/admin/finance", label: "Finance", icon: Wallet, group: "Operations" },
  { href: "/admin/certificates", label: "Certificates", icon: Award, group: "Operations" },
  { href: "/admin/home", label: "Home Content", icon: Settings, group: "Site & analytics" },
  { href: "/admin/ictf-team", label: "ICTF Team", icon: Users, group: "Site & analytics" },
  { href: "/admin/academic-staff", label: "Academic Staff", icon: GraduationCap, group: "Site & analytics" },
  { href: "/admin/blog", label: "Blog", icon: FileText, group: "Site & analytics" },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart, group: "Site & analytics" },
  { href: "/admin/social-tracking", label: "Social Tracking", icon: Share2, group: "Site & analytics" },
  { href: "/admin/inquiries", label: "Inquiries", icon: Mail, group: "Site & analytics" },
];
