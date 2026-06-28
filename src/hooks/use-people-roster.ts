"use client";

import { useCallback, useEffect, useState } from "react";
import { autoSyncStaffPortalAccounts } from "@/lib/actions/staff-portal-sync";
import { createClient } from "@/lib/supabase/client";
import { mapContentManager, mapPaperCenterStaff, mapTeacher } from "@/lib/supabase/mappers";
import type { PeopleRosterEntry } from "@/types";

export function usePeopleRoster() {
  const [data, setData] = useState<PeopleRosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        await autoSyncStaffPortalAccounts();
      } catch {
        // Non-blocking — roster still loads if sync is unavailable.
      }

      const supabase = createClient();
      const [teachersRes, adminsRes, contentRes, paperCenterRes] = await Promise.all([
        supabase.from("teachers").select("*").order("display_name"),
        supabase
          .from("profiles")
          .select("id, email, display_name, role")
          .in("role", ["admin", "super_admin"])
          .order("display_name"),
        supabase.from("content_managers").select("*").order("display_name"),
        supabase
          .from("paper_center_staff")
          .select("*, paper_centers(name, slug)")
          .order("display_name"),
      ]);

      if (cancelled) return;

      const entries: PeopleRosterEntry[] = [];

      for (const row of teachersRes.data ?? []) {
        const teacher = mapTeacher(row);
        entries.push({
          id: teacher.id,
          userId: teacher.userId,
          displayName: teacher.displayName,
          email: teacher.email,
          staffUsername: teacher.staffUsername,
          role: "teacher",
          active: teacher.active,
          subjects: teacher.subjects,
          courseIds: teacher.courseIds,
          certified: teacher.certified,
          sourceTable: "teachers",
        });
      }

      for (const row of adminsRes.data ?? []) {
        entries.push({
          id: row.id,
          userId: row.id,
          displayName: row.display_name,
          email: row.email,
          role: row.role === "super_admin" ? "super_admin" : "admin",
          active: true,
          sourceTable: "profiles",
        });
      }

      for (const row of contentRes.data ?? []) {
        const manager = mapContentManager(row);
        entries.push({
          id: manager.id,
          userId: manager.userId,
          displayName: manager.displayName,
          email: manager.email,
          role: "content_manager",
          active: manager.active,
          sourceTable: "content_managers",
        });
      }

      for (const row of paperCenterRes.data ?? []) {
        const staff = mapPaperCenterStaff(row);
        entries.push({
          id: staff.id,
          userId: staff.userId,
          displayName: staff.displayName,
          email: staff.email,
          staffUsername: staff.staffUsername,
          role: "paper_center_staff",
          active: staff.active,
          paperCenterId: staff.paperCenterId,
          paperCenterName: staff.paperCenterName,
          sourceTable: "paper_center_staff",
        });
      }

      entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setData(entries);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { data, loading, refresh };
}
