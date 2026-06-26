"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const CommandPalette = dynamic(
  () => import("@/components/layout/command-palette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

interface LazyCommandPaletteProps {
  variant?: "student" | "parent" | "admin";
}

export function LazyCommandPalette({ variant = "student" }: LazyCommandPaletteProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        setArmed(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!armed) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="hidden h-9 gap-2 border-icvf-border bg-white text-icvf-navy md:flex"
        onClick={() => setArmed(true)}
        aria-label="Open search"
      >
        <Search className="size-4" />
        <span className="text-muted-foreground">
          {variant === "admin" ? "Search admin..." : "Search..."}
        </span>
      </Button>
    );
  }

  return <CommandPalette variant={variant} />;
}
