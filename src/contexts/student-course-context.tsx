"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setStudentActiveCourse } from "@/lib/actions/academics";
import { useStudentEnrollments } from "@/hooks/use-academics";
import { useStudentData } from "@/hooks/use-data";

const STORAGE_KEY = "icvf-active-course-id";

type StudentCourseContextValue = {
  activeCourseId: string | null;
  activeCourseName: string | null;
  enrolledCourses: ReturnType<typeof useStudentEnrollments>["data"];
  loading: boolean;
  hasMultipleCourses: boolean;
  setActiveCourseId: (courseId: string) => Promise<void>;
};

const StudentCourseContext = createContext<StudentCourseContextValue | null>(null);

export function StudentCourseProvider({ children }: { children: React.ReactNode }) {
  const student = useStudentData();
  const { data: enrolledCourses, loading: enrollmentsLoading } = useStudentEnrollments(
    student?.id ?? null
  );
  const [activeCourseId, setActiveCourseIdState] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (student === undefined || enrollmentsLoading) return;

    const enrolledIds = new Set(enrolledCourses.map((e) => e.courseId));
    const stored =
      typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;

    let nextId: string | null = null;
    if (stored && enrolledIds.has(stored)) {
      nextId = stored;
    } else if (student?.courseId && enrolledIds.has(student.courseId)) {
      nextId = student.courseId;
    } else if (enrolledCourses[0]?.courseId) {
      nextId = enrolledCourses[0].courseId;
    } else {
      nextId = student?.courseId ?? null;
    }

    setActiveCourseIdState(nextId);
    if (nextId && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextId);
    }
    setInitialized(true);
  }, [student, enrolledCourses, enrollmentsLoading]);

  const setActiveCourseId = useCallback(async (courseId: string) => {
    setActiveCourseIdState(courseId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, courseId);
    }
    try {
      await setStudentActiveCourse(courseId);
    } catch {
      // Local selection still applies for enrolled courses; server sync is best-effort.
    }
  }, []);

  const activeCourseName = useMemo(() => {
    const match = enrolledCourses.find((e) => e.courseId === activeCourseId);
    if (match) return match.courseName;
    if (activeCourseId && student?.courseId === activeCourseId) {
      return student.courseName;
    }
    return student?.courseName ?? null;
  }, [enrolledCourses, activeCourseId, student]);

  const value = useMemo(
    () => ({
      activeCourseId,
      activeCourseName,
      enrolledCourses,
      loading: !initialized || student === undefined || enrollmentsLoading,
      hasMultipleCourses: enrolledCourses.length > 1,
      setActiveCourseId,
    }),
    [
      activeCourseId,
      activeCourseName,
      enrolledCourses,
      initialized,
      student,
      enrollmentsLoading,
      setActiveCourseId,
    ]
  );

  return (
    <StudentCourseContext.Provider value={value}>{children}</StudentCourseContext.Provider>
  );
}

export function useStudentCourse() {
  const context = useContext(StudentCourseContext);
  if (!context) {
    throw new Error("useStudentCourse must be used within StudentCourseProvider");
  }
  return context;
}

export function useActiveCourseId(fallbackCourseId?: string | null) {
  const context = useContext(StudentCourseContext);
  if (!context) {
    return fallbackCourseId ?? null;
  }
  return context.activeCourseId ?? fallbackCourseId ?? null;
}

export function useActiveCourseName(fallbackCourseName?: string | null) {
  const context = useContext(StudentCourseContext);
  if (!context) {
    return fallbackCourseName ?? null;
  }
  return context.activeCourseName ?? fallbackCourseName ?? null;
}
