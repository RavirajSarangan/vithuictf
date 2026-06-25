"use client";

import dynamic from "next/dynamic";

const IcvfSiteCursor = dynamic(
  () => import("@/components/shared/icvf-site-cursor").then((mod) => mod.IcvfSiteCursor),
  { ssr: false }
);

export function IcvfSiteCursorLazy() {
  return <IcvfSiteCursor />;
}
