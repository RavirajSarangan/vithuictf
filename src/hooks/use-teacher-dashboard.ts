"use client";

import { useMemo, useState } from "react";
import {
  useAdminCourses,
  useAdminResults,
  useAdminStudents,
  useCurrentTeacher,
} from "@/hooks/use-data";
import { useCalendarSessions } from "@/hooks/use-calendar";
import type { DashboardActivityItem } from "@/hooks/use-admin-dashboard";
import { filterStudentsForTeacher } from "@/lib/teacher-scope";
import type { CalendarSession } from "@/types";

export type TeacherDashboardStats = {
  myStudents: number;
  myCourses: number;
  recentResults: number;
  upcomingEvents: number;
  loading: boolean;
};

export type TeacherDashboardData = TeacherDashboardStats & {
  upcomingSessions: CalendarSession[];
  recentActivity: DashboardActivityItem[];
};

export function useTeacherDashboardStats(): TeacherDashboardStats {
  const data = useTeacherDashboardData();
  return {
    myStudents: data.myStudents,
    myCourses: data.myCourses,
    recentResults: data.recentResults,
    upcomingEvents: data.upcomingEvents,
    loading: data.loading,
  };
}

export function useTeacherDashboardData(): TeacherDashboardData {
  const teacher = useCurrentTeacher();
  const { data: students } = useAdminStudents();
  const { data: courses } = useAdminCourses();
  const { data: results } = useAdminResults();
  const { data: sessions, isLoading: sessionsLoading } = useCalendarSessions();
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [todayStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  });

  return useMemo(() => {
    const scopedStudents = filterStudentsForTeacher(students, "teacher", teacher);
    const scopedStudentIds = new Set(scopedStudents.map((s) => s.id));
    const courseIds = teacher?.courseIds ?? [];

    const myCourses =
      courseIds.length > 0
        ? courses.filter((c) => courseIds.includes(c.id)).length
        : courses.length;

    const scopedResults = results.filter((r) => scopedStudentIds.has(r.studentId));
    const recentResults = scopedResults.filter(
      (r) => new Date(r.date).getTime() >= weekAgo
    ).length;

    const scopedSessions = sessions.filter((s) => {
      if (courseIds.length === 0) return true;
      if (!s.courseId) return true;
      return courseIds.includes(s.courseId);
    });

    const upcomingSessions = scopedSessions
      .filter((s) => {
        if (s.sessionDate) {
          const d = new Date(s.sessionDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() >= todayStart;
        }
        return true;
      })
      .slice(0, 5);

    const upcomingEvents = upcomingSessions.length;

    const recentActivity: DashboardActivityItem[] = [];

    for (const student of scopedStudents) {
      if (!student.createdAt) continue;
      const created = new Date(student.createdAt).getTime();
      if (created < weekAgo) continue;
      recentActivity.push({
        id: `student-${student.id}`,
        type: "student",
        title: `New student: ${student.displayName}`,
        subtitle: student.courseName,
        href: `/admin/students/${student.id}`,
        timestamp: student.createdAt,
      });
    }

    for (const result of scopedResults) {
      if (new Date(result.date).getTime() < weekAgo) continue;
      recentActivity.push({
        id: `result-${result.id}`,
        type: "certificate",
        title: `Result: ${result.subject}`,
        subtitle: `${result.examTitle} — ${result.grade}`,
        href: "/admin/results",
        timestamp: result.date,
      });
    }

    recentActivity.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const loading = !teacher || sessionsLoading;

    return {
      myStudents: scopedStudents.length,
      myCourses,
      recentResults,
      upcomingEvents,
      upcomingSessions,
      recentActivity: recentActivity.slice(0, 10),
      loading,
    };
  }, [teacher, students, courses, results, sessions, sessionsLoading, weekAgo, todayStart]);
}
