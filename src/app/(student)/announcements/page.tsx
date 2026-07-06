"use client";

import { useCallback, useEffect, useState } from "react";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { getVisibleAnnouncements } from "@/lib/actions/announcements";
import { getActionErrorMessage } from "@/lib/action-error";
import { toast } from "sonner";
import type { PortalAnnouncement } from "@/types";

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<PortalAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setAnnouncements(await getVisibleAnnouncements());
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load announcements"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return <StudentPageLoading rows={3} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Announcements"
        description="Updates from your teachers — reply to ask questions."
      />

      {announcements.length === 0 ? (
        <StudentEmptyState message="No announcements yet. Updates from your teachers will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              href={`/announcements/${announcement.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
