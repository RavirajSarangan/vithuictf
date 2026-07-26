"use client";

import { useEffect, useState } from "react";
import { getMyFeaturePermissions } from "@/lib/actions/staff-permissions";
import type { StaffFeatureKey } from "@/lib/actions/auth";

/** Own permission state for nav hiding — only teachers ever get a `false`; everyone else sees all-true. */
export function useMyFeaturePermissions() {
  const [permissions, setPermissions] = useState<Record<StaffFeatureKey, boolean> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyFeaturePermissions()
      .then((result) => {
        if (!cancelled) setPermissions(result);
      })
      .catch(() => {
        if (!cancelled) setPermissions(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return permissions;
}
