"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Link as LinkIcon, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  createResultCheckLink,
  deleteResultCheckLink,
  listResultCheckLinks,
  updateResultCheckLinkStatus,
} from "@/lib/actions/result-check-links";
import { useAdminCourses } from "@/hooks/use-admin-data";
import type { ResultCheckLink, ResultCheckLinkStatus } from "@/types";

function statusBadge(status: ResultCheckLinkStatus) {
  if (status === "active") return <Badge variant="secondary">Active</Badge>;
  if (status === "paused") return <Badge variant="outline">Paused</Badge>;
  return <Badge variant="destructive">Closed</Badge>;
}

function buildCheckUrl(slug: string): string {
  if (typeof window === "undefined") return `/results/check/${slug}`;
  return `${window.location.origin}/results/check/${slug}`;
}

export function ResultCheckLinksPanel() {
  const { data: courses } = useAdminCourses();
  const [links, setLinks] = useState<ResultCheckLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [maxLookups, setMaxLookups] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshLinks = () => {
    setLoading(true);
    listResultCheckLinks()
      .then(setLinks)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshLinks();
  }, []);

  const handleCreate = async () => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      toast.error("Select a course");
      return;
    }
    setCreating(true);
    try {
      const result = await createResultCheckLink({
        courseId: course.id,
        courseName: course.name,
        maxLookups: maxLookups ? Number(maxLookups) : undefined,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("Result check link created");
      setCreatedUrl(result.checkUrl);
      setCourseId("");
      setMaxLookups("");
      refreshLinks();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to create result check link"));
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const handleStatusChange = async (id: string, status: ResultCheckLinkStatus) => {
    setStatusUpdating(id);
    try {
      const result = await updateResultCheckLinkStatus(id, status);
      if (!result.ok) throw new Error(result.error);
      refreshLinks();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to update link"));
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async (link: ResultCheckLink) => {
    const confirmed = window.confirm(
      `Delete the result check link for "${link.courseName}"? Students who already used it will no longer be able to.`
    );
    if (!confirmed) return;
    setDeletingId(link.id);
    try {
      const result = await deleteResultCheckLink(link.id);
      if (!result.ok) throw new Error(result.error);
      toast.success("Result check link deleted");
      refreshLinks();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to delete result check link"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="size-5" />
            Create result check link
          </CardTitle>
          <CardDescription>
            One shareable link per course. Any student who opens it submits their own username and student ID
            to view their own results — no login required.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="result-check-course">Course</Label>
              <Select value={courseId} onValueChange={(value) => setCourseId(value ?? "")}>
                <SelectTrigger id="result-check-course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="result-check-max">Max lookups (optional)</Label>
              <Input
                id="result-check-max"
                type="number"
                min={1}
                value={maxLookups}
                onChange={(e) => setMaxLookups(e.target.value)}
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
          <CardTitle>Result check links</CardTitle>
          <CardDescription>
            {links.length} link{links.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No result check links yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {links.map((link) => {
                const url = buildCheckUrl(link.slug);
                return (
                  <div key={link.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{link.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {link.lookupCount}
                          {link.maxLookups != null ? ` / ${link.maxLookups}` : ""} lookups
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
                      </div>
                    </div>
                    <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{url}</p>
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
