"use client";

import { useCallback, useMemo, useState } from "react";
import { updateInquiryStatus } from "@/lib/actions/inquiries";
import { useContactInquiries } from "@/hooks/use-data";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import {
  inquiryTableSummary,
  inquirySelectionInsights,
} from "@/lib/table-insights";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";

export default function AdminInquiriesPage() {
  const { data, refresh } = useContactInquiries();
  const [markingRead, setMarkingRead] = useState(false);

  const summaryItems = useMemo(() => inquiryTableSummary(data), [data]);

  const markRead = async (id: string) => {
    try {
      await updateInquiryStatus(id, "read");
      refresh();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to update"));
    }
  };

  const handleBulkMarkRead = useCallback(
    async (ids: string[]) => {
      setMarkingRead(true);
      try {
        const newIds = ids.filter((id) => data.find((i) => i.id === id)?.status === "new");
        if (newIds.length === 0) {
          toast.info("No new inquiries in selection");
          return;
        }
        await Promise.all(newIds.map((id) => updateInquiryStatus(id, "read")));
        refresh();
        toast.success(`Marked ${newIds.length} inquiry${newIds.length === 1 ? "" : "ies"} as read`);
      } catch (e) {
        toast.error(getActionErrorMessage(e, "Failed to update"));
      } finally {
        setMarkingRead(false);
      }
    },
    [data, refresh]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contact Inquiries" description="Messages from the marketing contact form" />
      {data.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No inquiries yet"
          description="Contact form submissions will appear here"
        />
      ) : (
        <AdminTableSection
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone", render: (r) => r.phone ?? "—" },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <Badge variant="secondary" className="border-border bg-muted text-foreground capitalize">
                  {r.status}
                </Badge>
              ),
            },
            {
              key: "message",
              label: "Message",
              render: (r) => <span className="line-clamp-2 max-w-xs">{r.message}</span>,
            },
            {
              key: "id",
              label: "",
              render: (r) =>
                r.status === "new" ? (
                  <Button size="sm" variant="outline" onClick={() => void markRead(r.id)}>
                    Mark read
                  </Button>
                ) : null,
            },
          ]}
          data={data}
          summaryItems={summaryItems}
          getSelectionInsights={inquirySelectionInsights}
          entityLabel="inquiry"
          renderBulkActions={(selectedIds) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markingRead || selectedIds.length === 0}
              onClick={() => void handleBulkMarkRead(selectedIds)}
            >
              Mark as read
            </Button>
          )}
          onActionComplete={refresh}
        />
      )}
    </div>
  );
}
