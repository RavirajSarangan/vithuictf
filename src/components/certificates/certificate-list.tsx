"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { Award } from "lucide-react";
import { sendCertificateEmail } from "@/lib/actions/certificates";
import { CertificateEditDialog } from "@/components/certificates/certificate-edit-dialog";
import { buildWhatsAppUrl } from "@/lib/certificates/parse-csv";
import type { CertificateListItem } from "@/hooks/use-certificates";

function deliveryBadge(status: CertificateListItem["deliveryStatus"]) {
  switch (status) {
    case "email_sent":
      return <Badge variant="secondary">Email sent</Badge>;
    case "whatsapp_sent":
      return <Badge variant="secondary">WhatsApp sent</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

interface CertificateListProps {
  certificates: CertificateListItem[];
  onRefresh: () => void;
}

export function CertificateList({ certificates, onRefresh }: CertificateListProps) {
  const [query, setQuery] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CertificateListItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return certificates;
    return certificates.filter(
      (c) =>
        c.studentName.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q) ||
        (c.certificateNumber ?? "").toLowerCase().includes(q) ||
        (c.recipientEmail ?? "").toLowerCase().includes(q)
    );
  }, [certificates, query]);

  const handleCopyLink = async (cert: CertificateListItem) => {
    const code = cert.certificateNumber ?? cert.verifyCode;
    if (!code) return;
    const url = `${window.location.origin}/verify/${code}`;
    await navigator.clipboard.writeText(url);
    toast.success("Verify link copied");
  };

  const handleSendEmail = async (cert: CertificateListItem) => {
    setSendingId(cert.id);
    try {
      const result = await sendCertificateEmail(cert.id);
      if (!result.ok) throw new Error(result.error);
      toast.success(`Email sent to ${cert.recipientEmail}`);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  const handleWhatsApp = (cert: CertificateListItem) => {
    if (!cert.recipientPhone) {
      toast.error("No phone number on this certificate");
      return;
    }
    const code = cert.certificateNumber ?? cert.verifyCode ?? cert.id;
    const message = `Congratulations ${cert.studentName}! Your ICTF certificate (${code}) for ${cert.courseName} is ready. Verify: ${window.location.origin}/verify/${code}`;
    window.open(buildWhatsAppUrl(cert.recipientPhone, message), "_blank", "noopener,noreferrer");
  };

  if (certificates.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No certificates yet"
        description="Use Manual Issue or Bulk Issue to generate certificates"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, course, ID, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Certificate ID</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cert) => {
                const code = cert.certificateNumber ?? cert.verifyCode;
                return (
                  <tr key={cert.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs">{code ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{cert.studentName}</td>
                    <td className="px-4 py-3">{cert.courseName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {cert.recipientEmail && <div>{cert.recipientEmail}</div>}
                      {cert.recipientPhone && <div>{cert.recipientPhone}</div>}
                      {!cert.recipientEmail && !cert.recipientPhone && "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{deliveryBadge(cert.deliveryStatus)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {code && (
                          <a
                            href={`/verify/${code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                            title="Verify"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                        <a
                          href={`/api/admin/certificates/${cert.id}/download`}
                          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                          title="Download"
                        >
                          <Download className="size-4" />
                        </a>
                        <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditing(cert)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Copy verify link" onClick={() => handleCopyLink(cert)}>
                          <Copy className="size-4" />
                        </Button>
                        {cert.recipientEmail && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Send email"
                            disabled={sendingId === cert.id}
                            onClick={() => handleSendEmail(cert)}
                          >
                            {sendingId === cert.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Mail className="size-4" />
                            )}
                          </Button>
                        )}
                        {cert.recipientPhone && (
                          <Button variant="ghost" size="icon-sm" title="Share via WhatsApp" onClick={() => handleWhatsApp(cert)}>
                            <MessageCircle className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CertificateEditDialog
        certificate={editing}
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSaved={onRefresh}
      />
    </div>
  );
}
