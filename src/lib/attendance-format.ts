export function attendanceBadgeVariant(percent: number): "default" | "outline" | "destructive" {
  if (percent < 75) return "destructive";
  if (percent < 85) return "outline";
  return "default";
}
