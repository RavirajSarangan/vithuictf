"use client";

import { usePathname } from "next/navigation";
import { MarketingHashSync } from "@/components/landing/marketing-hash-sync";
import { MarketingHeader } from "@/components/landing/marketing-header";
import { MarketingFooter } from "@/components/landing/marketing-footer";

export function AuthLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMinimalAuth = pathname === "/register" || pathname === "/login";

  if (isMinimalAuth) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-white text-icvf-text-dark">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-icvf-text-dark">
      <MarketingHashSync />
      <MarketingHeader />
      <main className="min-h-screen bg-gradient-to-b from-white via-icvf-surface/60 to-white pt-[calc(var(--marketing-header-offset,3.5rem)+1rem)] pb-16">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
