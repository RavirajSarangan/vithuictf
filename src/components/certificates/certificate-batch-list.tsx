"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendBulkCertificateEmails } from "@/lib/actions/certificates";
import type { CertificateBatch } from "@/types";

interface CertificateBatchListProps {
  batches: CertificateBatch[];
  onRefresh: () => void;
}

export function CertificateBatchList({ batches, onRefresh }: CertificateBatchListProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  if (batches.length === 0) return null;

  const handleBulkEmail = async (batchId: string) => {
    setSendingId(batchId);
    try {
      const result = await sendBulkCertificateEmails(batchId);
      if (!result.ok) throw new Error("Bulk send failed");
      toast.success(`Sent ${result.sent} email${result.sent === 1 ? "" : "s"}${result.failed ? ` · ${result.failed} failed` : ""}`);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send emails");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent batches</CardTitle>
        <CardDescription>Bulk issue runs — send pending emails for an entire batch</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {batches.slice(0, 5).map((batch) => (
          <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <p className="font-medium">{batch.name}</p>
              <p className="text-xs text-muted-foreground">
                {batch.successCount}/{batch.totalCount} issued · {new Date(batch.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={batch.status === "completed" ? "secondary" : "outline"}>{batch.status}</Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={sendingId === batch.id}
                onClick={() => void handleBulkEmail(batch.id)}
              >
                {sendingId === batch.id ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 size-4" />
                )}
                Email pending
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
