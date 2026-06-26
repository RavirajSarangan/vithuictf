"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportCsvButton<T extends object>({
  rows,
  columns,
  filename,
}: {
  rows: T[];
  columns: { key: keyof T; label: string }[];
  filename: string;
}) {
  const exportCsv = () => {
    const header = columns.map((c) => c.label).join(",");
    const lines = rows.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key];
          const str = val == null ? "" : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
      <Download data-icon="inline-start" />
      Export CSV
    </Button>
  );
}
