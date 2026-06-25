"use client";

import { updateInquiryStatus } from "@/lib/actions/inquiries";
import { useContactInquiries } from "@/hooks/use-data";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export default function AdminInquiriesPage() {
  const { data, refresh } = useContactInquiries();

  const markRead = async (id: string) => {
    try {
      await updateInquiryStatus(id, "read");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contact Inquiries" description="Messages from the marketing contact form" />
      {data.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No inquiries yet"
          description="Contact form submissions will appear here"
          className="border-white/10 bg-white/5 text-white"
        />
      ) : (
        <AdminTable
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone", render: (r) => r.phone ?? "—" },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <Badge variant="secondary" className="border-white/10 bg-white/10 text-white capitalize">
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
                  <Button size="sm" variant="outline" className="border-white/20 text-white" onClick={() => markRead(r.id)}>
                    Mark read
                  </Button>
                ) : null,
            },
          ]}
          data={data}
        />
      )}
    </div>
  );
}
