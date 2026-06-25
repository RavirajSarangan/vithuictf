"use client";

import { useEffect, useRef, useState } from "react";

interface LazyMapEmbedProps {
  src: string;
  title: string;
  className?: string;
}

export function LazyMapEmbed({ src, title, className }: LazyMapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {shouldLoad ? (
        <iframe
          src={src}
          width="100%"
          className="min-h-[280px] border-0 lg:min-h-[320px]"
          allowFullScreen
          loading="lazy"
          title={title}
        />
      ) : (
        <div
          className="flex min-h-[280px] items-center justify-center bg-icvf-surface text-sm text-icvf-text-light lg:min-h-[320px]"
          aria-hidden
        >
          Loading map…
        </div>
      )}
    </div>
  );
}
