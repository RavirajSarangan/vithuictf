"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  entityLabel: string;
  entityLabelPlural: string;
  warning?: string;
  deleting?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  entityLabel,
  entityLabelPlural,
  warning,
  deleting = false,
  onConfirm,
}: BulkDeleteDialogProps) {
  const label = count === 1 ? entityLabel : entityLabelPlural;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {label}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
            {warning ? ` ${warning}` : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Delete {count} {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Single-row delete confirmation for list pages */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  entityLabel,
  warning,
  deleting = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  warning?: string;
  deleting?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
            {warning ? ` ${warning}` : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
