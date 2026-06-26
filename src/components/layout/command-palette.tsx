"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { adminCommands } from "@/lib/admin-commands";
import { adminNav } from "@/lib/navigation";
import { Search } from "lucide-react";

interface CommandPaletteProps {
  variant?: "student" | "parent" | "admin";
}

const studentCommands = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Calendar", href: "/calendar" },
  { label: "Results", href: "/results" },
  { label: "Resources", href: "/resources" },
  { label: "Achievements", href: "/achievements" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "AI Assistant", href: "/ai-assistant" },
  { label: "Settings", href: "/settings" },
];

const parentCommands = [
  { label: "Dashboard", href: "/parent/dashboard" },
  { label: "Calendar", href: "/parent/calendar" },
  { label: "Performance", href: "/parent/performance" },
  { label: "Notifications", href: "/parent/notifications" },
];

const adminNavIcons = new Map(adminNav.map((item) => [item.href, item.icon]));

export function CommandPalette({ variant = "student" }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const navigationCommands = useMemo(() => {
    if (variant === "admin") {
      return adminCommands.filter((cmd) => cmd.group === "navigation");
    }
    if (variant === "parent") {
      return parentCommands.map((cmd) => ({ ...cmd, group: "navigation" as const }));
    }
    return studentCommands.map((cmd) => ({ ...cmd, group: "navigation" as const }));
  }, [variant]);

  const actionCommands = useMemo(() => {
    if (variant !== "admin") return [];
    return adminCommands.filter((cmd) => cmd.group === "actions");
  }, [variant]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden h-9 gap-2 border-icvf-border bg-white text-icvf-navy md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="text-muted-foreground">
          {variant === "admin" ? "Search admin..." : "Search..."}
        </span>
        <kbd className="rounded border border-border bg-muted px-1.5 text-xs text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={variant === "admin" ? "Search pages and actions..." : "Search pages..."} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navigationCommands.map((cmd) => {
              const Icon = variant === "admin" ? adminNavIcons.get(cmd.href) : undefined;
              return (
                <CommandItem
                  key={cmd.href}
                  value={`${cmd.label} ${cmd.href}`}
                  onSelect={() => navigate(cmd.href)}
                >
                  {Icon ? <Icon className="size-4 text-icvf-navy" /> : null}
                  {cmd.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          {actionCommands.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Quick actions">
                {actionCommands.map((cmd) => (
                  <CommandItem
                    key={cmd.href}
                    value={`${cmd.label} ${cmd.href} ${cmd.keywords?.join(" ") ?? ""}`}
                    onSelect={() => navigate(cmd.href)}
                  >
                    {cmd.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
