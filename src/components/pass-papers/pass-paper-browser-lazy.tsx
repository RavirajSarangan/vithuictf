"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const PassPaperBrowser = dynamic(
  () => import("./pass-paper-browser").then((mod) => mod.PassPaperBrowser),
  {
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading pass papers…</p>
    ),
  }
);

export function PassPaperBrowserLazy(props: ComponentProps<typeof PassPaperBrowser>) {
  return <PassPaperBrowser {...props} />;
}
