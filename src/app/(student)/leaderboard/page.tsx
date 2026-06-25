"use client";

import { useMemo } from "react";
import { useStudentData, useLeaderboard } from "@/hooks/use-data";
import { GlassCard } from "@/components/shared/glass-card";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const student = useStudentData();
  const { entries, isLoading: entriesLoading } = useLeaderboard(student?.courseId);
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.rank - b.rank),
    [entries]
  );
  const topThree = sortedEntries.slice(0, 3);

  if (student === undefined || entriesLoading) {
    return <StudentPageLoading rows={2} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Leaderboard"
        description={
          student?.courseName
            ? `Top performers in ${student.courseName}.`
            : "See how students rank in your course."
        }
      />

      {sortedEntries.length === 0 ? (
        <StudentEmptyState message="The leaderboard will populate once students in your course earn points." />
      ) : (
        <>
          {topThree.length > 0 ? (
            <div
              className={cn(
                "grid gap-3 sm:gap-4",
                topThree.length === 1 ? "grid-cols-1" : topThree.length === 2 ? "grid-cols-2" : "md:grid-cols-3"
              )}
            >
              {topThree.map((entry, i) => (
                <GlassCard
                  key={entry.id}
                  className={cn("text-center", i === 0 && "ring-2 ring-icvf-accent")}
                >
                  <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-icvf-navy sm:size-12">
                    {i === 0 ? (
                      <Trophy className="size-5 text-icvf-accent sm:size-6" />
                    ) : (
                      <Medal className="size-5 text-white sm:size-6" />
                    )}
                  </div>
                  <Avatar className="mx-auto size-14 sm:size-16">
                    <AvatarFallback className="bg-icvf-navy text-white">
                      {entry.studentName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-3 truncate font-bold text-icvf-navy">{entry.studentName}</h3>
                  <p className="font-semibold text-icvf-accent">{entry.points} pts</p>
                  <Badge className="mt-2 bg-icvf-navy text-white">Rank #{entry.rank}</Badge>
                </GlassCard>
              ))}
            </div>
          ) : null}

          <GlassCard>
            <h3 className="mb-4 font-semibold text-icvf-navy">Full leaderboard</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((e) => (
                    <TableRow
                      key={e.id}
                      className={cn(e.studentId === student?.id && "bg-icvf-accent/10")}
                    >
                      <TableCell className="font-bold text-icvf-navy">#{e.rank}</TableCell>
                      <TableCell>{e.studentName}</TableCell>
                      <TableCell>{e.points}</TableCell>
                      <TableCell>{e.performance}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
