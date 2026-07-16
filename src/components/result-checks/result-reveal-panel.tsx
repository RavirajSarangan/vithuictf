"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMarketingText } from "@/hooks/use-marketing-text";
import type { Result } from "@/types";

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

interface ResultRevealPanelProps {
  student: {
    displayName: string;
    district: string | null;
    courseName: string;
    photoUrl: string | null;
  };
  results: Result[];
  onReset: () => void;
}

export function ResultRevealPanel({ student, results, onReset }: ResultRevealPanelProps) {
  const { t } = useMarketingText();
  const reduceMotion = useReducedMotion();

  const initials = student.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 text-left">
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex items-center gap-4"
      >
        <Avatar className="size-14">
          {student.photoUrl ? <AvatarImage src={student.photoUrl} alt={student.displayName} /> : null}
          <AvatarFallback className="bg-icvf-navy text-base text-white">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-bold text-icvf-navy">{student.displayName}</p>
          <p className="text-sm text-icvf-text-light">{student.courseName}</p>
          <p className="text-xs text-icvf-text-light">
            {t("results.checkDistrictLabel")}: {student.district ?? "—"}
          </p>
        </div>
      </motion.div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-icvf-navy">
          {t("results.checkResultsTitle")}
        </h3>
        {results.length === 0 ? (
          <p className="text-sm text-icvf-text-light">{t("results.checkNoResults")}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <motion.tr
                    key={result.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/50"
                    initial={reduceMotion ? undefined : "hidden"}
                    animate={reduceMotion ? undefined : "visible"}
                    variants={rowVariants}
                    transition={{ delay: reduceMotion ? 0 : index * 0.05 }}
                  >
                    <TableCell>{result.examTitle}</TableCell>
                    <TableCell>{result.subject}</TableCell>
                    <TableCell>{result.term}</TableCell>
                    <TableCell>
                      {result.marks}/{result.maxMarks}
                    </TableCell>
                    <TableCell>{result.grade}</TableCell>
                    <TableCell>{result.rank || "—"}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Button variant="outline" onClick={onReset} className="w-fit">
        {t("results.checkAnother")}
      </Button>
    </div>
  );
}
