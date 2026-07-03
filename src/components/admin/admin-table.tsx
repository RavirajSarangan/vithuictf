"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  key: keyof T | string;
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
  rowHref?: (row: T) => string;
  emptyMessage?: string;
  rowClassName?: (row: T) => string | undefined;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  isIndeterminate?: boolean;
  getRowId?: (row: T) => string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  data,
  onDelete,
  onView,
  viewHref,
  rowHref,
  emptyMessage = "No records found",
  rowClassName,
  selectable = false,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  isAllSelected = false,
  isIndeterminate = false,
  getRowId = (row) => row.id,
}: AdminTableProps<T>) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <GlassCard className="p-8 text-center text-muted-foreground">
        {emptyMessage}
      </GlassCard>
    );
  }

  const showSelection = selectable && selectedIds && onSelectionChange;

  return (
    <GlassCard className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            {showSelection && (
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    isIndeterminate
                      ? (false as boolean)
                      : isAllSelected
                  }
                  data-state={isIndeterminate ? "indeterminate" : isAllSelected ? "checked" : "unchecked"}
                  onCheckedChange={() => onSelectAll?.()}
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            {columns.map((c) => (
              <TableHead key={String(c.key)} className="text-muted-foreground">
                {c.label}
              </TableHead>
            ))}
            {(onDelete || onView || viewHref) && (
              <TableHead className="w-12 text-muted-foreground" />
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const rowId = getRowId(row);
            const href = viewHref?.(row);
            const navHref = rowHref?.(row);
            const isSelected = showSelection && selectedIds.has(rowId);
            return (
              <TableRow
                key={row.id}
                onClick={navHref ? () => router.push(navHref) : undefined}
                className={cn(
                  "group",
                  navHref && "cursor-pointer",
                  isSelected && "bg-muted/40",
                  rowClassName?.(row)
                )}
              >
                {showSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(rowId)}
                      onCheckedChange={() => onSelectionChange(rowId)}
                      aria-label={`Select row ${rowId}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                {columns.map((c) => {
                  const cellLink = c.linkTo?.(row);
                  const content = c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key as string] ?? "");

                  return (
                    <TableCell key={String(c.key)}>
                      {cellLink ? (
                        <Link
                          href={cellLink}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="text-muted-foreground">
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
                            onClick={() => onDelete(rowId)}
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
