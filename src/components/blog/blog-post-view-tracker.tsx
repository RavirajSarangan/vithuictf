"use client";

import { useEffect, useRef } from "react";

interface BlogPostViewTrackerProps {
  slug: string;
}

/** Records a single view per browser session (24h cookie) when a post is opened. */
export function BlogPostViewTracker({ slug }: BlogPostViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    void fetch(`/api/blog/${encodeURIComponent(slug)}/view`, { method: "POST" });
  }, [slug]);

  return null;
}
