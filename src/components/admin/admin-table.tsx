"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, MoreHorizontal, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  label: string;
  linkTo?: (row: T) => string;
  render?: (row: T) => React.ReactNode;
}

interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onDelete?: (id: string) => void;
  onView?: (row: T) => void;
  viewHref?: (row: T) => string;
  emptyMessage?: string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  data,
  onDelete,
  onView,
  viewHref,
  emptyMessage = "No records found",
}: AdminTableProps<T>) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <GlassCard className="bg-white/5 border-white/10 p-8 text-center text-white/60">
        {emptyMessage}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden bg-white/5 border-white/10 p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            {columns.map((c) => (
              <TableHead key={String(c.key)} className="text-white/70">
                {c.label}
              </TableHead>
            ))}
            {(onDelete || onView || viewHref) && <TableHead className="w-12 text-white/70" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const href = viewHref?.(row);
            return (
              <TableRow key={row.id} className="group border-white/10 hover:bg-white/5">
                {columns.map((c) => {
                  const cellLink = c.linkTo?.(row);
                  const content = c.render ? c.render(row) : String(row[c.key] ?? "");

                  return (
                    <TableCell key={String(c.key)} className="text-white">
                      {cellLink ? (
                        <Link
                          href={cellLink}
                          className="inline-flex items-center gap-1 font-medium text-icvf-accent hover:underline"
                        >
                          {content}
                          <ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      ) : (
                        content
                      )}
                    </TableCell>
                  );
                })}
                {(onDelete || onView || viewHref) && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        {(onView || viewHref) && (
                          <DropdownMenuItem
                            onClick={() => {
                              if (href) router.push(href);
                              else onView?.(row);
                            }}
                          >
                            View details
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(row.id)}
                          >
                            <Trash2 className={cn("mr-2 size-4")} />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </GlassCard>
  );
}
