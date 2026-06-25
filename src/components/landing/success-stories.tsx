"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MarketingCtaActions,
  MarketingJoinPillars,
  MarketingPanel,
  MarketingSection,
  MarketingSectionCta,
  MarketingSectionIntro,
} from "@/components/landing/marketing-layout";
import { useSuccessStories } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SuccessStories() {
  const stories = useSuccessStories();
  const { t } = useMarketingText();
  const [index, setIndex] = useState(0);

  const joinPillars = [
    { index: 1, title: t("join.liveClasses"), description: t("join.step1Desc") },
    { index: 2, title: t("join.massClasses"), description: t("join.step2Desc") },
    { index: 3, title: t("join.ourStudents"), description: t("join.step3Desc") },
  ];

  if (!stories.length) {
    return (
      <MarketingSection id="stories" tone="surface">
        <div className="mx-auto max-w-4xl animate-pulse">
          <div className="mx-auto h-8 w-64 rounded-lg bg-icvf-border" />
          <div className="mt-8 h-48 rounded-2xl bg-white" />
        </div>
      </MarketingSection>
    );
  }

  const story = stories[index];

  return (
    <MarketingSection id="stories" tone="surface">
      <MarketingSectionIntro
        title={t("stories.title")}
        subtitle={t("stories.subtitle")}
        light={false}
        badgeVariant="accent"
        align="left"
      />

      <MarketingJoinPillars items={joinPillars} />

      <MarketingPanel className="relative shadow-xl">
        <Quote className="absolute right-6 top-6 size-10 text-icvf-accent/20 sm:right-8 sm:top-8 sm:size-12" />
        <AnimatePresence mode="wait">
          <motion.div
            key={story.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <Avatar className="size-16 sm:size-20">
                <AvatarFallback className="bg-icvf-navy text-lg text-white sm:text-xl">
                  {story.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-icvf-text-dark sm:text-2xl">{story.name}</h3>
                <p className="font-semibold text-icvf-accent">{story.course}</p>
                <p className="mt-1 text-sm font-bold text-icvf-navy">{story.achievement}</p>
                <p className="mt-4 text-sm italic leading-relaxed text-icvf-text-light sm:text-base">
                  &ldquo;{story.review}&rdquo;
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndex((i) => (i - 1 + stories.length) % stories.length)}
            aria-label={t("stories.prev")}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            {stories.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`size-2 rounded-full transition-colors ${i === index ? "bg-icvf-accent" : "bg-icvf-border"}`}
                onClick={() => setIndex(i)}
                aria-label={`${t("stories.goTo")} ${i + 1}`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndex((i) => (i + 1) % stories.length)}
            aria-label={t("stories.next")}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </MarketingPanel>

      <MarketingSectionCta title={t("join.title")} subtitle={t("join.tagline")}>
        <MarketingCtaActions registerLabel={t("btn.register")} loginLabel={t("btn.login")} />
      </MarketingSectionCta>
    </MarketingSection>
  );
}
