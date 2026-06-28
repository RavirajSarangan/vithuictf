export function exportToCsv(filename: string, rows: Record<string, string | number | boolean | null | undefined>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escape = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => escape(String(row[key] ?? "")))
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
