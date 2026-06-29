"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getFinanceLedger,
  getFinanceOverview,
  getFinanceStudentRoster,
  getStudentFinanceDetail,
} from "@/lib/actions/finance";
import type {
  FinanceOverview,
  SessionCharge,
  StudentBillingSummary,
  StudentFinanceRosterRow,
} from "@/types";

export function useFinanceOverview() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFinanceOverview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((e) => {
        console.error("Finance overview failed:", e);
        if (!cancelled) setOverview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { overview, loading, refresh };
}

export function useFinanceStudentRoster() {
  const [rows, setRows] = useState<StudentFinanceRosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFinanceStudentRoster()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        console.error("Finance roster failed:", e);
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { rows, loading, refresh };
}

export function useStudentFinanceDetail(studentId: string) {
  const [summaries, setSummaries] = useState<StudentBillingSummary[]>([]);
  const [charges, setCharges] = useState<SessionCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    setLoading(true);
    getStudentFinanceDetail(studentId)
      .then((data) => {
        if (!cancelled) {
          setSummaries(data.summaries);
          setCharges(data.charges);
        }
      })
      .catch((e) => {
        console.error("Student finance detail failed:", e);
        if (!cancelled) {
          setSummaries([]);
          setCharges([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, version]);

  return { summaries, charges, loading, refresh };
}

export function useFinanceLedger(filters?: {
  courseId?: string;
  status?: "pending" | "paid" | "waived" | "void";
  billingMonth?: string;
}) {
  const [charges, setCharges] = useState<SessionCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const filterKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFinanceLedger(filters)
      .then((data) => {
        if (!cancelled) setCharges(data);
      })
      .catch((e) => {
        console.error("Finance ledger failed:", e);
        if (!cancelled) setCharges([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filterKey, version]);

  return { charges, loading, refresh };
}
