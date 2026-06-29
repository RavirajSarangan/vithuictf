"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Student } from "@/types";

type Props = {
  students: Student[];
  value: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
};

export function StudentFinderCombobox({
  students,
  value,
  onChange,
  multiple = true,
  placeholder = "Search students…",
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => students.filter((s) => value.includes(s.id)),
    [students, value]
  );

  const toggle = (id: string) => {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange([id]);
      setOpen(false);
    }
  };

  const label =
    selected.length === 0
      ? placeholder
      : multiple
        ? `${selected.length} student(s) selected`
        : selected[0]?.displayName;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Name, email, or student ID…" />
          <CommandList>
            <CommandEmpty>No students found.</CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={`${student.displayName} ${student.email} ${student.studentId}`}
                  onSelect={() => toggle(student.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value.includes(student.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{student.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.studentId} · {student.courseName || "No course"}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
