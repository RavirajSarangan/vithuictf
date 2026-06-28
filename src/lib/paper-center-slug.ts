export function slugifyPaperCenterName(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64) || "paper-center"
  );
}

export function paperCenterLoginPath(slug: string): string {
  return `/login/paper-center/${slug}`;
}
