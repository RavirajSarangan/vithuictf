"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { BulkDeleteResult } from "@/lib/actions/bulk-delete";
import { formatBulkDeleteToast } from "@/lib/table-insights";

export function useBulkDeleteHandler(
  bulkFn: (ids: string[]) => Promise<BulkDeleteResult>,
  entityLabel: string,
  onComplete?: () => void
) {
  return useCallback(
    async (ids: string[]) => {
      const result = await bulkFn(ids);
      const { type, message } = formatBulkDeleteToast(result, entityLabel);
      if (type === "success") toast.success(message);
      else if (type === "warning") toast.warning(message);
      else toast.error(message);
      onComplete?.();
      return result;
    },
    [bulkFn, entityLabel, onComplete]
  );
}
