"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { formatViewCount } from "@/lib/blog/format-view-count";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface BlogViewCountProps {
  postId: string;
  initialCount: number;
  variant?: "light" | "dark";
}

export function BlogViewCount({ postId, initialCount, variant = "light" }: BlogViewCountProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let disposed = false;
    let removeChannel: (() => void) | undefined;

    void (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      if (disposed) return;

      const supabase = createClient();
      const channel = supabase
        .channel(`blog_post_views:${postId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "blog_posts",
            filter: `id=eq.${postId}`,
          },
          (payload) => {
            const row = payload.new as { view_count?: number };
            if (typeof row.view_count === "number") {
              setCount(row.view_count);
            }
          }
        )
        .subscribe();

      if (disposed) {
        void supabase.removeChannel(channel);
        return;
      }

      removeChannel = () => {
        void supabase.removeChannel(channel);
      };
    })();

    return () => {
      disposed = true;
      removeChannel?.();
    };
  }, [postId]);

  const toneClass = variant === "dark" ? "text-white/60" : "text-icvf-text-light";

  return (
    <span
      className={`inline-flex items-center gap-1 ${toneClass}`}
      title={`${count.toLocaleString()} views`}
    >
      <Eye className="size-3.5" aria-hidden />
      <span>{formatViewCount(count)}</span>
    </span>
  );
}
