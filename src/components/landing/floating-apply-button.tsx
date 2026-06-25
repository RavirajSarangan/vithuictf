"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

function shouldShowPastHero(hero: HTMLElement) {
  const rect = hero.getBoundingClientRect();
  return rect.bottom < window.innerHeight * 0.15;
}

export function FloatingApplyButton() {
  const { t } = useMarketingText();
  const pathname = usePathname();
  const [visible, setVisible] = useState(pathname !== "/");

  useEffect(() => {
    if (pathname !== "/") {
      setVisible(true);
      return undefined;
    }

    const hero = document.getElementById("home");
    if (!hero) {
      setVisible(false);
      return undefined;
    }

    if (typeof IntersectionObserver === "undefined") {
      const onScroll = () => setVisible(shouldShowPastHero(hero));
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    let observer: IntersectionObserver | undefined;

    try {
      observer = new IntersectionObserver(
        ([entry]) => {
          setVisible(!entry.isIntersecting);
        },
        { threshold: 0.12, rootMargin: "0px 0px -64px 0px" }
      );
      observer.observe(hero);
    } catch {
      const onScroll = () => setVisible(shouldShowPastHero(hero));
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    return () => observer?.disconnect();
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden",
        "bg-gradient-to-t from-marketing-page via-marketing-page/95 to-transparent",
        "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5"
      )}
    >
      <ButtonLink
        href="/register"
        variant="icvf"
        size="lg"
        className="pointer-events-auto mx-auto flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full text-sm font-semibold shadow-lg shadow-icvf-accent/20"
      >
        {t("btn.register")}
        <ArrowRight className="size-4" aria-hidden />
      </ButtonLink>
    </div>
  );
}
