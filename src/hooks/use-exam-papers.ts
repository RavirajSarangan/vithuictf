"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapExamPaperBatch,
  mapExamPaperSubmission,
  mapPaperCenter,
  mapPaperCenterStaff,
} from "@/lib/supabase/mappers";
import type { ExamPaperBatch, ExamPaperSubmission, PaperCenter } from "@/types";

export function usePaperCentersList() {
  const [centers, setCenters] = useState<PaperCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("paper_centers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (cancelled) return;
      setCenters((data ?? []).map(mapPaperCenter));
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { centers, loading };
}

export function usePaperCenterStaffProfile() {
  const [staff, setStaff] = useState<ReturnType<typeof mapPaperCenterStaff> | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setStaff(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("paper_center_staff")
        .select("*, paper_centers(name, district, address, slug)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setStaff(data ? mapPaperCenterStaff(data) : null);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { staff, loading, refresh };
}

export function useStaffExamPaperBatches() {
  const [batches, setBatches] = useState<ExamPaperBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("exam_paper_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setBatches((data ?? []).map(mapExamPaperBatch));
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { batches, loading, refresh };
}

export type ExamPaperBatchWithSubmissions = ExamPaperBatch & {
  submissions: ExamPaperSubmission[];
};

export function useAdminExamPaperBatches() {
  const [batches, setBatches] = useState<ExamPaperBatchWithSubmissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const supabase = createClient();
      const { data: batchRows } = await supabase
        .from("exam_paper_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      const batchIds = (batchRows ?? []).map((row) => row.id);
      let submissions: ExamPaperSubmission[] = [];

      if (batchIds.length > 0) {
        const { data: submissionRows } = await supabase
          .from("exam_paper_submissions")
          .select("*")
          .in("batch_id", batchIds)
          .order("created_at", { ascending: true });

        submissions = (submissionRows ?? []).map(mapExamPaperSubmission);
      }

      const grouped = new Map<string, ExamPaperSubmission[]>();
      for (const submission of submissions) {
        const list = grouped.get(submission.batchId) ?? [];
        list.push(submission);
        grouped.set(submission.batchId, list);
      }

      setBatches(
        (batchRows ?? []).map((row) => ({
          ...mapExamPaperBatch(row),
          submissions: grouped.get(row.id) ?? [],
        }))
      );
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { batches, loading, refresh };
}
