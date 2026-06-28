"use client";

import { useCallback, useEffect, useState } from "react";
import { useCachedList } from "@/hooks/use-cached-list";
import { createClient } from "@/lib/supabase/client";
import {
  mapAchievement,
  mapActivity,
  mapCourse,
  mapExam,
  mapLeaderboard,
  mapNotification,
  mapParent,
  mapPlatformSettings,
  mapResource,
  mapResult,
  mapStudent,
  mapTeacher,
} from "@/lib/supabase/mappers";
import { markNotificationRead as markReadAction } from "@/lib/actions/admin";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/payment-access";
import type {
  Achievement,
  ActivityItem,
  Course,
  Exam,
  LeaderboardEntry,
  Notification,
  Parent,
  PlatformSettings,
  Resource,
  Result,
  Student,
  Teacher,
} from "@/types";
import { useAuth } from "@/providers/auth-provider";

export function useStudentData() {
  const { user, initialized } = useAuth();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      setStudent(undefined);
      setLoadedForUserId(null);
      return;
    }

    let cancelled = false;
    setStudent(undefined);
    setLoadedForUserId(null);

    const supabase = createClient();
    supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setStudent(data ? mapStudent(data) : null);
          setLoadedForUserId(user.id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, initialized]);

  if (!initialized) return undefined;
  if (!user) return null;
  if (loadedForUserId !== user.id) return undefined;
  return student;
}


export function useStudentResults(studentId?: string) {
  const fetcher = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("results").select("*").eq("student_id", studentId!);
    return (data ?? []).map(mapResult);
  }, [studentId]);

  const { data, isLoading } = useCachedList<Result>(
    studentId ? `results:${studentId}` : null,
    fetcher,
    Boolean(studentId)
  );

  return { results: data, isLoading };
}


export function useAchievements(studentId?: string) {
  const fetcher = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("achievements").select("*").eq("student_id", studentId!);
    return (data ?? []).map(mapAchievement);
  }, [studentId]);

  const { data, isLoading } = useCachedList<Achievement>(
    studentId ? `achievements:${studentId}` : null,
    fetcher,
    Boolean(studentId)
  );

  return { achievements: data, isLoading };
}


export function useNotifications({ enabled = true }: { enabled?: boolean } = {}) {
  const { user } = useAuth();
  const [data, setData] = useState<Notification[]>([]);

  const refresh = useCallback(() => {
    if (!user || !enabled) return;

    const supabase = createClient();
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data: rows }) => setData((rows ?? []).map(mapNotification)));
  }, [enabled, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markRead = async (id: string) => {
    await markReadAction(id)
    setData((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return { notifications: data, markRead, unreadCount: data.filter((n) => !n.read).length };
}


export function useLeaderboard(courseId?: string) {
  const fetcher = useCallback(async () => {
    const supabase = createClient();
    let query = supabase.from("leaderboard").select("*").order("rank", { ascending: true });
    if (courseId) query = query.eq("course_id", courseId);
    const { data: rows } = await query;
    return (rows ?? []).map(mapLeaderboard);
  }, [courseId]);

  const { data, isLoading } = useCachedList<LeaderboardEntry>(
    `leaderboard:${courseId ?? "all"}`,
    fetcher,
    true
  );

  return { entries: data, isLoading };
}


export function useResources() {
  const fetcher = useCallback(async () => {
    const supabase = createClient();
    const { data: rows } = await supabase.from("resources").select("*");
    return (rows ?? []).map(mapResource);
  }, []);

  const { data, isLoading } = useCachedList<Resource>("resources:all", fetcher, true);

  return { resources: data, isLoading };
}


export function useCourseById(courseId?: string) {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const supabase = createClient();
    supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle()
      .then(({ data }) => setCourse(data ? mapCourse(data) : null));
  }, [courseId]);

  return courseId ? course : null;
}


export function useExams() {
  const fetcher = useCallback(async () => {
    const supabase = createClient();
    const { data: rows } = await supabase.from("exams").select("*");
    return (rows ?? []).map(mapExam);
  }, []);

  const { data, isLoading } = useCachedList<Exam>("exams:all", fetcher, true);

  return { exams: data, isLoading };
}


export function useActivities(studentId?: string) {
  const fetcher = useCallback(async () => {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("activities")
      .select("*")
      .eq("student_id", studentId!)
      .order("created_at", { ascending: false });
    return (rows ?? []).map(mapActivity);
  }, [studentId]);

  const { data, isLoading } = useCachedList<ActivityItem>(
    studentId ? `activities:${studentId}` : null,
    fetcher,
    Boolean(studentId)
  );

  return { activities: data, isLoading };
}


export function useParentData() {
  const { user, initialized } = useAuth();
  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Student[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      setParent(null);
      setChildren([]);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    const supabase = createClient();
    supabase
      .from("parents")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data: p }) => {
        if (cancelled) return;
        if (!p) {
          setParent(null);
          setChildren([]);
          setLoaded(true);
          return;
        }
        const { data: links } = await supabase
          .from("parent_student_links")
          .select("student_id")
          .eq("parent_id", p.id);
        const ids = (links ?? []).map((l) => l.student_id);
        const { data: students } = ids.length
          ? await supabase.from("students").select("*").in("id", ids)
          : { data: [] };
        if (!cancelled) {
          setParent(mapParent(p, ids));
          setChildren((students ?? []).map(mapStudent));
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, initialized]);

  return { parent, children, loading: !initialized || !loaded };
}


export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("platform_settings fetch failed:", error.message);
          setSettings(DEFAULT_PLATFORM_SETTINGS);
        } else if (data) {
          setSettings(mapPlatformSettings(data));
        } else {
          setSettings(DEFAULT_PLATFORM_SETTINGS);
        }
        setLoading(false);
      });

    const channel = supabase
      .channel("platform_settings:hook")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "platform_settings",
          filter: "id=eq.1",
        },
        (payload) => {
          if (cancelled) return;
          setSettings(mapPlatformSettings(payload.new as Parameters<typeof mapPlatformSettings>[0]));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [version]);

  return { settings, loading, refresh };
}

export function useCurrentTeacher() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const teacherUserId = user?.role === "teacher" ? user.id : null;

  useEffect(() => {
    if (!teacherUserId) return;

    let cancelled = false;
    createClient()
      .from("teachers")
      .select("*")
      .eq("user_id", teacherUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setTeacher(data ? mapTeacher(data) : null);
      });

    return () => {
      cancelled = true;
    };
  }, [teacherUserId]);

  return teacherUserId ? teacher : null;
}

