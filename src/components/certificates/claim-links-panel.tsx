"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Copy, Link as LinkIcon, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  createCertificateClaimLink,
  deleteCertificateClaimLink,
  listCertificateClaimLinks,
  listCertificatesForClaimLink,
  updateCertificateClaimLinkStatus,
} from "@/lib/actions/certificate-claim-links";
import { CertificateList } from "@/components/certificates/certificate-list";
import type { CertificateListItem } from "@/hooks/use-certificates";
import type { CertificateClaimLink, CertificateClaimLinkStatus } from "@/types";

function statusBadge(status: CertificateClaimLinkStatus) {
  if (status === "active") return <Badge variant="secondary">Active</Badge>;
  if (status === "paused") return <Badge variant="outline">Paused</Badge>;
  return <Badge variant="destructive">Closed</Badge>;
}

function buildClaimUrl(slug: string): string {
  if (typeof window === "undefined") return `/certificate/claim/${slug}`;
  return `${window.location.origin}/certificate/claim/${slug}`;
}

export function ClaimLinksPanel() {
  const [links, setLinks] = useState<CertificateClaimLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxClaims, setMaxClaims] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [claims, setClaims] = useState<CertificateListItem[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshLinks = () => {
    setLoading(true);
    listCertificateClaimLinks()
      .then(setLinks)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshLinks();
  }, []);

  const refreshClaims = async (linkId: string) => {
    setClaimsLoading(true);
    try {
      setClaims(await listCertificatesForClaimLink(linkId));
    } finally {
      setClaimsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!courseName.trim()) {
      toast.error("Enter a course name");
      return;
    }
    setCreating(true);
    try {
      const result = await createCertificateClaimLink({
        courseName: courseName.trim(),
        issueDate,
        maxClaims: maxClaims ? Number(maxClaims) : undefined,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("Claim link created");
      setCreatedUrl(result.claimUrl);
      setCourseName("");
      setMaxClaims("");
      refreshLinks();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to create claim link"));
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const handleStatusChange = async (id: string, status: CertificateClaimLinkStatus) => {
    setStatusUpdating(id);
    try {
      const result = await updateCertificateClaimLinkStatus(id, status);
      if (!result.ok) throw new Error(result.error);
      refreshLinks();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to update link"));
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async (link: CertificateClaimLink) => {
    const confirmed = window.confirm(
      `Delete the claim link for "${link.courseName}"? Certificates already claimed through it are kept, but the link itself will stop working.`
    );
    if (!confirmed) return;
    setDeletingId(link.id);
    try {
      const result = await deleteCertificateClaimLink(link.id);
      if (!result.ok) throw new Error(result.error);
      toast.success("Claim link deleted");
      if (expandedId === link.id) setExpandedId(null);
      refreshLinks();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to delete claim link"));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (link: CertificateClaimLink) => {
    if (expandedId === link.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(link.id);
    void refreshClaims(link.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="size-5" />
            Create claim link
          </CardTitle>
          <CardDescription>
            One shareable link per course. Any student who opens it submits their own name and email to claim
            their certificate — reopening with the same email always returns the same certificate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="claim-course-name">Course name</Label>
              <Input
                id="claim-course-name"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Program or course title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-issue-date">Issue date</Label>
              <Input
                id="claim-issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="claim-max">Max claims (optional)</Label>
              <Input
                id="claim-max"
                type="number"
                min={1}
                value={maxClaims}
                onChange={(e) => setMaxClaims(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>
          <Button disabled={creating} onClick={() => void handleCreate()}>
            {creating ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Create link
          </Button>
          {createdUrl ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <code className="flex-1 truncate text-xs">{createdUrl}</code>
              <Button variant="ghost" size="icon-sm" onClick={() => void handleCopy(createdUrl)}>
                <Copy className="size-4" />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claim links</CardTitle>
          <CardDescription>
            {links.length} link{links.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No claim links yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {links.map((link) => {
                const url = buildClaimUrl(link.slug);
                const expanded = expandedId === link.id;
                return (
                  <div key={link.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{link.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                          Issued {new Date(link.issueDate).toLocaleDateString()} · {link.claimCount}
                          {link.maxClaims != null ? ` / ${link.maxClaims}` : ""} claimed
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(link.status)}
                        <Button variant="ghost" size="icon-sm" title="Copy link" onClick={() => void handleCopy(url)}>
                          <Copy className="size-4" />
                        </Button>
                        {link.status !== "closed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={statusUpdating === link.id}
                            onClick={() =>
                              void handleStatusChange(link.id, link.status === "active" ? "paused" : "active")
                            }
                          >
                            {link.status === "active" ? "Pause" : "Resume"}
                          </Button>
                        ) : null}
                        {link.status !== "closed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={statusUpdating === link.id}
                            onClick={() => void handleStatusChange(link.id, "closed")}
                          >
                            Close
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Delete link"
                          disabled={deletingId === link.id}
                          onClick={() => void handleDelete(link)}
                        >
                          {deletingId === link.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4 text-destructive" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => toggleExpand(link)}>
                          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{url}</p>
                    {expanded ? (
                      <div className="mt-4 border-t pt-4">
                        {claimsLoading ? (
                          <p className="text-sm text-muted-foreground">Loading claims…</p>
                        ) : (
                          <CertificateList certificates={claims} onRefresh={() => void refreshClaims(link.id)} />
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
