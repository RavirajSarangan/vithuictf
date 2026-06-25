"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiArrowRightLine } from "@remixicon/react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { ButtonLink } from "@/components/shared/button-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCourseById } from "@/hooks/use-data";
import { useStudentOnboarding } from "@/hooks/use-student-onboarding";
import {
  MIN_PORTAL_STEPS_TO_FINISH,
  PORTAL_ONBOARDING_STEPS,
} from "@/lib/onboarding/student-steps";
import { cn } from "@/lib/utils";
import { ONBOARDING_TOUR_KEY } from "@/components/onboarding/onboarding-gate";
import { BRAND } from "@/lib/constants";

type Phase = "welcome" | "course" | "explore";

const PHASES: Phase[] = ["welcome", "course", "explore"];

function phaseFromSteps(steps: Record<string, boolean>): Phase {
  if (steps.course) return "explore";
  if (steps.welcome) return "course";
  return "welcome";
}

export function StudentOnboarding() {
  const router = useRouter();
  const { student, steps, markStep, finish, canFinish, portalProgress, hydrated } =
    useStudentOnboarding();
  const course = useCourseById(student?.courseId);

  const [phaseOverride, setPhaseOverride] = React.useState<Phase | null>(null);

  const resumedPhase = hydrated ? phaseFromSteps(steps) : "welcome";
  const phase = phaseOverride ?? resumedPhase;

  React.useEffect(() => {
    if (hydrated && steps.course) {
      sessionStorage.setItem(ONBOARDING_TOUR_KEY, "1");
    }
  }, [hydrated, steps.course]);

  const phaseIndex = PHASES.indexOf(phase);
  const phasePct = Math.round(((phaseIndex + 1) / PHASES.length) * 100);

  const firstName = student?.displayName?.split(" ")[0] ?? "Student";
  const coursePending = !student?.courseName || student.courseName === "General";

  async function handleWelcomeNext() {
    await markStep("welcome", true);
    setPhaseOverride("course");
  }

  async function handleCourseNext() {
    await markStep("course", true);
    sessionStorage.setItem(ONBOARDING_TOUR_KEY, "1");
    setPhaseOverride("explore");
  }

  async function handleFinish() {
    if (!canFinish) {
      toast.error(`Complete at least ${MIN_PORTAL_STEPS_TO_FINISH} portal steps first.`);
      return;
    }
    await finish();
    sessionStorage.removeItem(ONBOARDING_TOUR_KEY);
    toast.success(`You're all set! Welcome to ${BRAND.name}.`);
    router.push("/dashboard");
  }

  function togglePortalStep(id: string, checked: boolean) {
    void markStep(id, checked);
  }

  if (!hydrated || !student) {
    return (
      <div className="mx-auto max-w-lg animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <PageHeader
        title="Student setup"
        description={`A quick tour of your ${BRAND.platformName} — takes about 2 minutes.`}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Setup progress</span>
          <span className="text-muted-foreground tabular-nums">
            Step {phaseIndex + 1} of {PHASES.length}
          </span>
        </div>
        <Progress value={phasePct} aria-label={`Step ${phaseIndex + 1} of ${PHASES.length}`} />
      </div>

      {phase === "welcome" && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to {BRAND.name}, {firstName}</CardTitle>
            <CardDescription>
              Your student portal is where you track classes, results, resources, and achievements
              for your program. You&apos;re already signed in with the password you chose at
              registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">ID: {student.studentId}</Badge>
              {student.indexNumber ? (
                <Badge variant="secondary">Index: {student.indexNumber}</Badge>
              ) : null}
              {student.username ? (
                <Badge variant="secondary">@{student.username}</Badge>
              ) : null}
              <Badge className="bg-icvf-navy text-white">{student.courseName}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Need to change your password later? You can update it anytime in Settings.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => void handleWelcomeNext()}>
              Let&apos;s get started
              <RiArrowRightLine data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {phase === "course" && (
        <Card>
          <CardHeader>
            <CardTitle>Your program</CardTitle>
            <CardDescription>
              {coursePending
                ? `Your program assignment may still be pending. You can explore the portal while ${BRAND.name} confirms enrollment.`
                : "You are enrolled in this ICT program. Your schedule, exams, and leaderboard are filtered to this course."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-lg font-semibold">{student.courseName}</p>
              {course && (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {course.category && <p>Category: {course.category}</p>}
                  {course.durationMonths && <p>Duration: {course.durationMonths} months</p>}
                  {course.teacherName && <p>Lead teacher: {course.teacherName}</p>}
                  {course.description && <p className="pt-1">{course.description}</p>}
                </div>
              )}
            </div>
            <ButtonLink href="/#programs" variant="link" className="h-auto justify-start p-0">
              View all {BRAND.name} programs on our website
              <ExternalLink className="ml-1 size-3.5" />
            </ButtonLink>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setPhaseOverride("welcome")}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => void handleCourseNext()}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      )}

      {phase === "explore" && (
        <Card>
          <CardHeader>
            <CardTitle>Explore your portal</CardTitle>
            <CardDescription>
              Visit each area below ({MIN_PORTAL_STEPS_TO_FINISH}+ required). Open a page, then mark
              it complete — or it auto-completes when you visit.
            </CardDescription>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Portal checklist</span>
                <span className="text-muted-foreground tabular-nums">
                  <span className="font-medium text-foreground">{portalProgress}</span> of{" "}
                  {PORTAL_ONBOARDING_STEPS.length}
                </span>
              </div>
              <Progress
                value={Math.round(
                  (portalProgress / PORTAL_ONBOARDING_STEPS.length) * 100
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-0">
            <Separator />
            {PORTAL_ONBOARDING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isDone = !!steps[step.id];
              return (
                <div key={step.id}>
                  <div className="flex items-start gap-3 py-4">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        isDone
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isDone && "text-muted-foreground line-through"
                        )}
                      >
                        {step.title}
                        {step.optional && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            (optional)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{step.description}</span>
                      <Button
                        variant="link"
                        className="h-auto justify-start p-0 text-xs"
                        nativeButton={false}
                        render={<Link href={step.href} />}
                      >
                        Go there →
                      </Button>
                    </div>
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={(checked) =>
                        togglePortalStep(step.id, checked === true)
                      }
                      aria-label={`Mark "${step.title}" complete`}
                      className="mt-1"
                    />
                  </div>
                  {index < PORTAL_ONBOARDING_STEPS.length - 1 && <Separator />}
                </div>
              );
            })}
            <Separator />
            <p className="py-3 text-xs text-muted-foreground">
              On mobile, use the command menu (⌘K) to reach Achievements, Leaderboard, and AI
              Assistant quickly.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setPhaseOverride("course")}>
              Back
            </Button>
            <Button className="flex-1" disabled={!canFinish} onClick={() => void handleFinish()}>
              Finish setup
              <RiArrowRightLine data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
