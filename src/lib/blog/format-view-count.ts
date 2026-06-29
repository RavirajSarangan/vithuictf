export function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${trimTrailingZero((count / 1_000_000).toFixed(1))}M`;
  }
  if (count >= 1_000) {
    return `${trimTrailingZero((count / 1_000).toFixed(1))}K`;
  }
  return String(count);
}

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, "");
}
