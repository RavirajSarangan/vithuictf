"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface UseTableSelectionOptions<T> {
  data: T[];
  getRowId?: (row: T) => string;
}

export function useTableSelection<T extends { id: string }>({
  data,
  getRowId = (row) => row.id,
}: UseTableSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const visibleIds = useMemo(() => data.map(getRowId), [data, getRowId]);

  // Prune selections that no longer exist in the dataset
  useEffect(() => {
    const validIds = new Set(visibleIds);
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleIds]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (ids?: string[]) => {
      const targetIds = ids ?? visibleIds;
      setSelectedIds((prev) => {
        const allSelected = targetIds.length > 0 && targetIds.every((id) => prev.has(id));
        if (allSelected) {
          const next = new Set(prev);
          for (const id of targetIds) next.delete(id);
          return next;
        }
        return new Set([...prev, ...targetIds]);
      });
    },
    [visibleIds]
  );

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const isAllSelected = useMemo(
    () => visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id)),
    [visibleIds, selectedIds]
  );

  const isIndeterminate = useMemo(
    () =>
      visibleIds.some((id) => selectedIds.has(id)) &&
      !visibleIds.every((id) => selectedIds.has(id)),
    [visibleIds, selectedIds]
  );

  const selectedRows = useMemo(
    () => data.filter((row) => selectedIds.has(getRowId(row))),
    [data, selectedIds, getRowId]
  );

  return {
    selectedIds,
    selectedRows,
    toggle,
    selectAll,
    clear,
    isAllSelected,
    isIndeterminate,
    visibleIds,
  };
}
