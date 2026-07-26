"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFacultyStudentRoster } from "@/hooks/use-faculty-academics";
import { Search, Users } from "lucide-react";

// Read-only roster of students enrolled in the current faculty member's
// batches. Unlike the teacher-side academics/students page, there is no
// "Manage" drawer or active/disable toggle here — updateStudent/
// setStudentActive operate on the shared students table and aren't cloned
// for faculty in this phase (attendance-adjacent student edits are a later
// phase). This page is intentionally roster-viewing only, scoped via
// useFacultyStudentRoster (built from faculty_batch_enrollments, which RLS
// already restricts to this faculty member's batches).
export default function FacultyStudentsPage() {
  const { data: roster, loading } = useFacultyStudentRoster();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(({ student, enrollments }) => {
      const haystack = [
        student.displayName,
        student.email,
        student.studentId,
        ...enrollments.map((e) => e.course.name),
        ...enrollments.map((e) => e.batch.batchCode),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [roster, query]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="Students enrolled in your batches, with course and batch context"
      />

      <div className="relative max-w-xl">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, email, ID, course, batch…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Students enrolled in your batches will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Batches</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ student, enrollments }) => (
                <tr key={student.id} className="border-b align-top last:border-b-0">
                  <td className="px-4 py-3">{student.studentId}</td>
                  <td className="px-4 py-3 font-medium">{student.displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {enrollments.map((e) => (
                        <div key={e.enrollmentId} className="flex items-center gap-2">
                          <Badge variant={e.active ? "default" : "outline"}>{e.batch.batchCode}</Badge>
                          <span className="text-xs text-muted-foreground">{e.course.name}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={student.active !== false ? "default" : "outline"}>
                      {student.active !== false ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
