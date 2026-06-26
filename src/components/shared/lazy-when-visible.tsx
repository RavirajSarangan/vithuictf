"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazyWhenVisibleProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string;
}

/** Mount children only when near the viewport — saves JS and paint on mobile / slow networks. */
export function LazyWhenVisible({
  children,
  fallback = null,
  rootMargin = "280px 0px",
  minHeight = "14rem",
}: LazyWhenVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const supportsObserver =
    typeof window !== "undefined" && typeof IntersectionObserver !== "undefined";
  const [visible, setVisible] = useState(!supportsObserver);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible || !supportsObserver) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin, supportsObserver]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : fallback}
    </div>
  );
}
