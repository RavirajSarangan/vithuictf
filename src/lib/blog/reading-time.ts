export function computeReadingTimeMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}
