/** Parse YYYY-MM-DD as local calendar date (avoids UTC timezone shift on Vercel). */
export function parseCertificateIssueDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return new Date(value);
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function formatCertificateIssueDate(date: Date, format = "DD.MM.YYYY"): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return format.replace("DD", day).replace("MM", month).replace("YYYY", year);
}
