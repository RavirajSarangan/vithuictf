import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  LayoutDashboard,
  Medal,
  Settings,
  Trophy,
} from "lucide-react";

export type OnboardingStepId =
  | "welcome"
  | "security"
  | "course"
  | "dashboard"
  | "calendar"
  | "resources"
  | "results"
  | "achievements"
  | "leaderboard"
  | "ai-assistant"
  | "settings";

export interface PortalOnboardingStep {
  id: Exclude<OnboardingStepId, "welcome" | "security" | "course">;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  optional?: boolean;
}

export const PORTAL_ONBOARDING_STEPS: PortalOnboardingStep[] = [
  {
    id: "dashboard",
    title: "Know your home base",
    description: "Stats, today's classes, upcoming exams, and recent activity.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "calendar",
    title: "Check your schedule",
    description: "Weekly classes, rooms, and teachers for your program.",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    id: "resources",
    title: "Find study materials",
    description: "Notes, past papers, videos, and assignments.",
    href: "/resources",
    icon: BookOpen,
  },
  {
    id: "results",
    title: "Track your performance",
    description: "Grades, charts, and full exam history.",
    href: "/results",
    icon: BarChart3,
  },
  {
    id: "achievements",
    title: "Earn badges & streaks",
    description: "Points, medals, and learning milestones.",
    href: "/achievements",
    icon: Medal,
  },
  {
    id: "leaderboard",
    title: "See where you rank",
    description: "Course leaderboard and top performers.",
    href: "/leaderboard",
    icon: Trophy,
  },
  {
    id: "ai-assistant",
    title: "Get study help",
    description: "AI-powered study tools and quick answers.",
    href: "/ai-assistant",
    icon: Brain,
    optional: true,
  },
  {
    id: "settings",
    title: "Manage your account",
    description: "Profile, password, and notification preferences.",
    href: "/settings",
    icon: Settings,
  },
];

export const ROUTE_TO_ONBOARDING_STEP: Record<string, OnboardingStepId> = {
  "/dashboard": "dashboard",
  "/calendar": "calendar",
  "/resources": "resources",
  "/results": "results",
  "/achievements": "achievements",
  "/leaderboard": "leaderboard",
  "/ai-assistant": "ai-assistant",
  "/settings": "settings",
};

/** Required portal steps (non-optional) that must be visited before finishing. */
export const REQUIRED_PORTAL_STEP_IDS = PORTAL_ONBOARDING_STEPS.filter((s) => !s.optional).map(
  (s) => s.id
);

export const MIN_PORTAL_STEPS_TO_FINISH = 5;

export function countCompletedPortalSteps(steps: Record<string, boolean>): number {
  return PORTAL_ONBOARDING_STEPS.filter((s) => steps[s.id]).length;
}

export function canFinishOnboarding(steps: Record<string, boolean>): boolean {
  const welcome = steps.welcome === true;
  const course = steps.course === true;
  const portalCount = countCompletedPortalSteps(steps);
  return welcome && course && portalCount >= MIN_PORTAL_STEPS_TO_FINISH;
}
