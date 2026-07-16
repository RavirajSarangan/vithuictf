"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResultCheckForm } from "@/components/result-checks/result-check-form";
import { useMarketingData } from "@/contexts/marketing-data-context";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function ResultsCheckCtaButton() {
  const data = useMarketingData();
  const { t } = useMarketingText();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  if (!data?.resultsCheckEnabled) return null;

  return (
    <>
      <motion.div
        animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
        transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex"
      >
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="gap-2 border-icvf-accent/40 text-icvf-navy shadow-[0_0_0_0_rgba(245,166,35,0.4)] hover:shadow-[0_0_24px_0_rgba(245,166,35,0.35)]"
          size="lg"
        >
          <Search className="size-4" />
          {t("results.checkCta")}
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("results.checkModalTitle")}</DialogTitle>
            <DialogDescription>{t("results.checkModalDescription")}</DialogDescription>
          </DialogHeader>
          <ResultCheckForm />
          <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/results/check" />}>
            {t("results.checkOpenFull")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
