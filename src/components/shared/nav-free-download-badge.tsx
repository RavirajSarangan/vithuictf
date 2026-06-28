"use client";

import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

export function NavFreeDownloadBadge({ className }: { className?: string }) {
  const { t } = useMarketingText();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-icvf-accent/35 bg-icvf-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-icvf-accent xl:px-2 xl:text-[10px]",
        className
      )}
    >
      {t("nav.passPapersFreeDownload")}
    </span>
  );
}
