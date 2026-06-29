"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course, CourseBatch } from "@/types";
import type { StudentSearchFilters } from "@/lib/academics/student-search";

type Props = {
  filters: StudentSearchFilters;
  onChange: (filters: StudentSearchFilters) => void;
  courses?: Course[];
  batches?: CourseBatch[];
  showEnrollmentFilters?: boolean;
};

export function StudentSearchBar({
  filters,
  onChange,
  courses = [],
  batches = [],
  showEnrollmentFilters = true,
}: Props) {
  const [localQuery, setLocalQuery] = useState(filters.query ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, query: localQuery });
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        document.getElementById("student-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clearAll = () => {
    setLocalQuery("");
    onChange({});
  };

  const hasFilters =
    localQuery ||
    (filters.courseId && filters.courseId !== "all") ||
    (filters.batchId && filters.batchId !== "all") ||
    (filters.registrationStatus && filters.registrationStatus !== "all") ||
    (filters.accountStatus && filters.accountStatus !== "all") ||
    (filters.enrollmentStatus && filters.enrollmentStatus !== "all");

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-xl">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="student-search-input"
          className="pl-9 pr-9"
          placeholder="Search name, email, ID, NIC, course, batch…"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
        />
        {localQuery && (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            onClick={() => setLocalQuery("")}
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showEnrollmentFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.courseId ?? "all"}
            onValueChange={(v) =>
              onChange({ ...filters, courseId: !v || v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.batchId ?? "all"}
            onValueChange={(v) =>
              onChange({ ...filters, batchId: !v || v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} ({b.batchCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.registrationStatus ?? "all"}
            onValueChange={(v) =>
              onChange({
                ...filters,
                registrationStatus: v === "all" ? undefined : (v as StudentSearchFilters["registrationStatus"]),
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Registration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All registrations</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.accountStatus ?? "all"}
            onValueChange={(v) =>
              onChange({
                ...filters,
                accountStatus: v === "all" ? undefined : (v as "active" | "disabled"),
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.enrollmentStatus ?? "all"}
            onValueChange={(v) =>
              onChange({
                ...filters,
                enrollmentStatus: v === "all" ? undefined : (v as StudentSearchFilters["enrollmentStatus"]),
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Enrollment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All enrollments</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="not_enrolled">Not enrolled</SelectItem>
              <SelectItem value="multi">Multi-course</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
