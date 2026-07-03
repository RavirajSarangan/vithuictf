"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function exportRowsToCsv<T extends object>(
  rows: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
) {
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
}

export function ExportCsvButton<T extends object>({
  rows,
  columns,
  filename,
  disabled,
}: {
  rows: T[];
  columns: { key: keyof T; label: string }[];
  filename: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled ?? rows.length === 0}
      onClick={() => exportRowsToCsv(rows, columns, filename)}
    >
      <Download data-icon="inline-start" />
      Export CSV
    </Button>
  );
}
