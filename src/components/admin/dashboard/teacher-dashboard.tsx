"use client";

import { useMemo } from "react";
import { CourseCard } from "@/components/courses/course-card";
import { DashboardActivityFeed } from "@/components/admin/dashboard/dashboard-activity-feed";
import { DashboardHero } from "@/components/admin/dashboard/dashboard-hero";
import { DashboardQuickActions } from "@/components/admin/dashboard/dashboard-quick-actions";
import { DashboardUpcomingSessions } from "@/components/admin/dashboard/dashboard-upcoming-sessions";
import { TeacherSectionCards } from "@/components/admin/dashboard/teacher-section-cards";
import { useAdminCourses, useCurrentTeacher } from "@/hooks/use-data";
import { useTeacherDashboardData } from "@/hooks/use-teacher-dashboard";
import { useAuth } from "@/providers/auth-provider";

export function TeacherDashboard() {
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const dashboard = useTeacherDashboardData();
  const { data: courses } = useAdminCourses();

  const myCourses = useMemo(() => {
    const courseIds = teacher?.courseIds ?? [];
    if (courseIds.length > 0) {
      return courses.filter((course) => courseIds.includes(course.id));
    }
    if (teacher?.displayName) {
      return courses.filter(
        (course) => course.teacherName.toLowerCase() === teacher.displayName.toLowerCase()
      );
    }
    return courses;
  }, [courses, teacher]);

  return (
    <div className="admin-dashboard @container/main flex flex-col gap-4 md:gap-6">
      <DashboardHero role="teacher" displayName={user?.displayName} />
      <DashboardQuickActions role="teacher" />
      <TeacherSectionCards stats={dashboard} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardUpcomingSessions
          sessions={dashboard.upcomingSessions}
          loading={dashboard.loading}
        />
        <DashboardActivityFeed
          items={dashboard.recentActivity}
          loading={dashboard.loading}
          title="Your recent activity"
        />
      </div>

      {myCourses.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-icvf-navy">Your courses</h2>
            <span className="text-sm text-muted-foreground">
              {myCourses.length} course{myCourses.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((course) => (
              <CourseCard
                key={course.id}
                compact
                title={course.name}
                description={course.description}
                coverImageUrl={course.coverImageUrl}
                category={course.category}
                durationMonths={course.durationMonths}
                teacherName={course.teacherName}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
