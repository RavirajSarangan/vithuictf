"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademicsStudents } from "@/hooks/use-academics";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatSriLankaWhatsAppDisplay } from "@/lib/validation/sri-lanka-phone";
import type { Student } from "@/types";

interface BatchStudentEnrollPanelProps {
  courseId?: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  excludeEnrolledInBatchId?: string | null;
  enrolledStudentIds?: Set<string>;
}

function matchesSearch(student: Student, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    student.studentId.toLowerCase().includes(q) ||
    student.displayName.toLowerCase().includes(q) ||
    student.email.toLowerCase().includes(q) ||
    (student.phone ?? "").toLowerCase().includes(q) ||
    (student.schoolName ?? "").toLowerCase().includes(q)
  );
}

export function BatchStudentEnrollPanel({
  courseId,
  selectedIds,
  onSelectionChange,
  excludeEnrolledInBatchId: _batchId,
  enrolledStudentIds,
}: BatchStudentEnrollPanelProps) {
  const { data: students, loading } = useAcademicsStudents();
  const [search, setSearch] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const available = useMemo(() => {
    return students.filter((s) => {
      if (s.active === false) return false;
      if (enrolledStudentIds?.has(s.id)) return false;
      if (courseId && s.courseId !== courseId) {
        // still show all students for batch enroll; course filter is soft hint only
      }
      return matchesSearch(s, search);
    });
  }, [students, search, enrolledStudentIds, courseId]);

  const focused = available.find((s) => s.id === focusedId) ?? available[0] ?? null;

  const toggle = (id: string, checked: boolean) => {
    onSelectionChange(checked ? [...selectedIds, id] : selectedIds.filter((sid) => sid !== id));
  };

  return (
    <div className="space-y-3">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by student ID, name, email, phone, school..."
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : available.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matching students.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {available.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm hover:bg-muted/60"
                onMouseEnter={() => setFocusedId(s.id)}
              >
                <Checkbox
                  checked={selectedIds.includes(s.id)}
                  onCheckedChange={(v) => toggle(s.id, v === true)}
                />
                <span>
                  <span className="font-medium">{s.displayName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.studentId} · {s.courseName}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {focused ? (
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="font-semibold">{focused.displayName}</p>
              <dl className="mt-2 space-y-1 text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <dt>Student ID</dt>
                  <dd className="text-foreground">{focused.studentId}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Email</dt>
                  <dd className="text-foreground">{focused.email}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Phone</dt>
                  <dd className="text-foreground">
                    {focused.phone ? formatSriLankaWhatsAppDisplay(focused.phone) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>School</dt>
                  <dd className="text-foreground">{focused.schoolName || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Course</dt>
                  <dd className="text-foreground">{focused.courseName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Grade / exam</dt>
                  <dd className="text-foreground">
                    {focused.ictGrade || "—"}
                    {focused.examYear ? ` · ${focused.examYear}` : ""}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{focused.studentId}</Badge>
                <Link href={`/admin/students/${focused.id}`} className="text-xs text-icvf-accent hover:underline">
                  View full profile
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{selectedIds.length} student(s) selected</p>
    </div>
  );
}
