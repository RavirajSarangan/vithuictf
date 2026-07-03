"use client";

import { AdminTable } from "@/components/admin/admin-table";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { SelectionInsightsPanel } from "@/components/admin/selection-insights-panel";
import { TableSummaryCards } from "@/components/admin/table-summary-cards";
import { useTableSelection } from "@/hooks/use-table-selection";
import type { BulkDeleteResult } from "@/lib/actions/bulk-delete";
import type { SelectionInsight } from "@/components/admin/selection-insights-panel";
import type { SummaryCardItem } from "@/components/admin/table-summary-cards";

type Column<T> = {
  key: keyof T | string;
  label: string;
  linkTo?: (row: T) => string;
  render?: (row: T) => React.ReactNode;
};

interface AdminTableSectionProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  summaryItems: SummaryCardItem[];
  getSelectionInsights?: (selectedRows: T[]) => SelectionInsight[];
  entityLabel?: string;
  entityLabelPlural?: string;
  onBulkDelete?: (ids: string[]) => Promise<BulkDeleteResult>;
  deleteWarning?: string;
  exportConfig?: {
    columns: { key: keyof T; label: string }[];
    filename: string;
  };
  extraActions?: React.ReactNode;
  renderBulkActions?: (selectedIds: string[]) => React.ReactNode;
  onActionComplete?: () => void;
  onDelete?: (id: string) => void;
  onView?: (row: T) => void;
  viewHref?: (row: T) => string;
  rowHref?: (row: T) => string;
  emptyMessage?: string;
  rowClassName?: (row: T) => string | undefined;
  getRowId?: (row: T) => string;
}

export function AdminTableSection<T extends { id: string }>({
  data,
  columns,
  summaryItems,
  getSelectionInsights,
  entityLabel = "record",
  entityLabelPlural,
  onBulkDelete,
  deleteWarning,
  exportConfig,
  extraActions,
  renderBulkActions,
  onActionComplete,
  onDelete,
  onView,
  viewHref,
  rowHref,
  emptyMessage,
  rowClassName,
  getRowId,
}: AdminTableSectionProps<T>) {
  const selection = useTableSelection({ data, getRowId });

  const resolvedInsights =
    selection.selectedIds.size > 0 && getSelectionInsights
      ? getSelectionInsights(selection.selectedRows)
      : [];

  return (
    <>
      <TableSummaryCards items={summaryItems} />

      <SelectionInsightsPanel
        count={selection.selectedIds.size}
        insights={resolvedInsights}
      />

      <BulkActionBar
        selectedCount={selection.selectedIds.size}
        onClear={selection.clear}
        entityLabel={entityLabel}
        entityLabelPlural={entityLabelPlural}
        selectedIds={[...selection.selectedIds]}
        onBulkDelete={onBulkDelete}
        deleteWarning={deleteWarning}
        exportConfig={
          exportConfig
            ? {
                rows: selection.selectedRows,
                columns: exportConfig.columns,
                filename: exportConfig.filename,
              }
            : undefined
        }
        extraActions={extraActions}
        renderExtraActions={renderBulkActions}
        onActionComplete={onActionComplete}
      />

      <AdminTable
        columns={columns}
        data={data}
        selectable
        selectedIds={selection.selectedIds}
        onSelectionChange={selection.toggle}
        onSelectAll={() => selection.selectAll()}
        isAllSelected={selection.isAllSelected}
        isIndeterminate={selection.isIndeterminate}
        getRowId={getRowId}
        onDelete={onDelete}
        onView={onView}
        viewHref={viewHref}
        rowHref={rowHref}
        emptyMessage={emptyMessage}
        rowClassName={rowClassName}
      />
    </>
  );
}
