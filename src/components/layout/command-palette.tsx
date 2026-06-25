"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
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

const adminCommands = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Calendar", href: "/admin/calendar" },
  { label: "Students", href: "/admin/students" },
  { label: "Teachers", href: "/admin/teachers" },
  { label: "Courses", href: "/admin/courses" },
  { label: "Results", href: "/admin/results" },
  { label: "Resources", href: "/admin/resources" },
  { label: "Analytics", href: "/admin/analytics" },
];

export function CommandPalette({ variant = "student" }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const commands = variant === "admin" ? adminCommands : variant === "parent" ? parentCommands : studentCommands;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button variant="outline" size="sm" className="hidden gap-2 md:flex" onClick={() => setOpen(true)}>
        <Search className="size-4" />
        <span className="text-muted-foreground">Search...</span>
        <kbd className="rounded border bg-muted px-1.5 text-xs">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {commands.map((cmd) => (
              <CommandItem key={cmd.href} onSelect={() => { router.push(cmd.href); setOpen(false); }}>
                {cmd.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
