"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, X } from "lucide-react";
import { exportRowsToCsv } from "@/components/admin/export-csv-button";
import { BulkDeleteDialog } from "@/components/admin/bulk-delete-dialog";
import type { BulkDeleteResult } from "@/lib/actions/bulk-delete";

interface BulkActionBarProps<T extends object> {
  selectedCount: number;
  onClear: () => void;
  entityLabel?: string;
  entityLabelPlural?: string;
  onBulkDelete?: (ids: string[]) => Promise<BulkDeleteResult>;
  selectedIds?: string[];
  exportConfig?: {
    rows: T[];
    columns: { key: keyof T; label: string }[];
    filename: string;
  };
  deleteWarning?: string;
  extraActions?: React.ReactNode;
  renderExtraActions?: (selectedIds: string[]) => React.ReactNode;
  onActionComplete?: () => void;
}

export function BulkActionBar<T extends object>({
  selectedCount,
  onClear,
  entityLabel = "record",
  entityLabelPlural,
  onBulkDelete,
  selectedIds = [],
  exportConfig,
  deleteWarning,
  extraActions,
  renderExtraActions,
  onActionComplete,
}: BulkActionBarProps<T>) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (selectedCount === 0) return null;

  const plural = entityLabelPlural ?? `${entityLabel}s`;

  const handleExport = () => {
    if (!exportConfig) return;
    exportRowsToCsv(exportConfig.rows, exportConfig.columns, exportConfig.filename);
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    setDeleting(true);
    try {
      await onBulkDelete(selectedIds);
      onClear();
      onActionComplete?.();
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? entityLabel : plural} selected
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {extraActions}
          {renderExtraActions?.(selectedIds)}
          {exportConfig && (
            <Button type="button" variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 size-4" />
              Export selected
            </Button>
          )}
          {onBulkDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete selected
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-2 size-4" />
            Clear
          </Button>
        </div>
      </div>

      {onBulkDelete && (
        <BulkDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          count={selectedCount}
          entityLabel={entityLabel}
          entityLabelPlural={plural}
          warning={deleteWarning}
          deleting={deleting}
          onConfirm={handleBulkDelete}
        />
      )}
    </>
  );
}
