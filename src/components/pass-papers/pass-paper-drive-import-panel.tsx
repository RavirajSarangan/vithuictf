"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ensurePassPaperExamTemplate,
  fullSyncPassPapersFromDrive,
  getGoogleDriveImportStatus,
  publishPassPaperSubtreeComplete,
  syncPassPapersFromDrive,
} from "@/lib/actions/pass-papers";
import { DEFAULT_DRIVE_ROOT_URL, type DriveSyncReport } from "@/lib/pass-papers/drive-sync-types";
import type { PassPaperExamType, PassPaperFolder } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type PassPaperDriveImportPanelProps = {
  folders: PassPaperFolder[];
  onComplete: () => void;
};

export function PassPaperDriveImportPanel({ folders, onComplete }: PassPaperDriveImportPanelProps) {
  const [rootUrl, setRootUrl] = useState(DEFAULT_DRIVE_ROOT_URL);
  const [dryRun, setDryRun] = useState(true);
  const [publish, setPublish] = useState(false);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [syncAl, setSyncAl] = useState(true);
  const [syncOl, setSyncOl] = useState(true);
  const [running, setRunning] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState<PassPaperExamType | null>(null);
  const [report, setReport] = useState<DriveSyncReport | null>(null);
  const [driveConfigured, setDriveConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    void getGoogleDriveImportStatus()
      .then((status) => setDriveConfigured(status.configured))
      .catch(() => setDriveConfigured(false));
  }, []);

  const examTypes = useMemo(() => {
    const types: PassPaperExamType[] = [];
    if (syncAl) types.push("al");
    if (syncOl) types.push("ol");
    return types;
  }, [syncAl, syncOl]);

  const alRoot = folders.find((f) => f.slug === "a-l-past-papers" && !f.parentId);
  const olRoot = folders.find((f) => f.slug === "o-l-past-papers" && !f.parentId);

  const handleImport = async () => {
    if (examTypes.length === 0) {
      toast.error("Select at least one exam type to sync.");
      return;
    }
    setRunning(true);
    try {
      const result = await syncPassPapersFromDrive({
        rootUrl,
        dryRun,
        publish,
        includeFiles,
        examTypes,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReport(result.report);
      toast.success(
        dryRun
          ? `Dry run complete: ${result.report.created} would create, ${result.report.skipped} skip`
          : `Import complete: ${result.report.created} created, ${result.report.updated} updated`
      );
      if (!dryRun) onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Drive import failed");
    } finally {
      setRunning(false);
    }
  };

  const handleCreateTemplate = async (examType: Extract<PassPaperExamType, "al" | "ol">) => {
    setCreatingTemplate(examType);
    try {
      const result = await ensurePassPaperExamTemplate(examType);
      toast.success(
        `${examType === "al" ? "A/L" : "O/L"} template ready${
          result.createdFolders > 0 ? ` (${result.createdFolders} folder(s) created)` : ""
        }`
      );
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Template creation failed");
    } finally {
      setCreatingTemplate(null);
    }
  };

  const handleFullSync = async () => {
    setFullSyncing(true);
    try {
      const result = await fullSyncPassPapersFromDrive({ rootUrl });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReport(result.report);
      const alItems = result.published.al?.itemsUpdated ?? 0;
      const olItems = result.published.ol?.itemsUpdated ?? 0;
      toast.success(
        `Full sync complete: ${result.report.created} links created, ${result.report.updated} updated. Published ${alItems + olItems} paper link(s).`
      );
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Full sync failed");
    } finally {
      setFullSyncing(false);
    }
  };

  const handlePublishSubtree = async (folderId: string, label: string) => {
    setPublishing(true);
    try {
      const result = await publishPassPaperSubtreeComplete(folderId, true);
      toast.success(
        `${label}: published ${result.foldersUpdated} folder(s) and ${result.itemsUpdated} paper link(s)`
      );
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border bg-white p-4">
      <div>
        <h3 className="text-base font-semibold text-icvf-navy">Import from Google Drive</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Maps A/L and O/L → Medium → Year from your{" "}
          <a
            href={DEFAULT_DRIVE_ROOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-icvf-navy underline"
          >
            Drive root folder
          </a>
          . Use <strong>Sync all &amp; publish</strong> to import every PDF link and make them live on the
          public site. Share the folder with your service account email first.
        </p>
      </div>

      {driveConfigured === false ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Google Drive credentials are not configured on this server. Add{" "}
          <code className="text-xs">GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON</code> or{" "}
          <code className="text-xs">GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64</code> in Vercel
          environment variables, share the Drive folder with the service account email, then redeploy.
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="drive-root-url">Drive root URL</Label>
        <Input
          id="drive-root-url"
          value={rootUrl}
          onChange={(e) => setRootUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={dryRun} onCheckedChange={setDryRun} />
          <Label>Dry run (preview only)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={publish} onCheckedChange={setPublish} disabled={dryRun} />
          <Label>Publish on import</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={includeFiles} onCheckedChange={setIncludeFiles} />
          <Label>Include PDF files inside year folders</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={syncAl} onCheckedChange={setSyncAl} />
          <Label>Sync A/L</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={syncOl} onCheckedChange={setSyncOl} />
          <Label>Sync O/L</Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!alRoot ? (
          <Button
            type="button"
            variant="outline"
            disabled={running || fullSyncing || publishing || creatingTemplate !== null}
            onClick={() => void handleCreateTemplate("al")}
          >
            {creatingTemplate === "al" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Create A/L template
          </Button>
        ) : null}
        {!olRoot ? (
          <Button
            type="button"
            variant="outline"
            disabled={running || fullSyncing || publishing || creatingTemplate !== null}
            onClick={() => void handleCreateTemplate("ol")}
          >
            {creatingTemplate === "ol" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Create O/L template
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={() => void handleFullSync()}
          disabled={
            running || fullSyncing || publishing || creatingTemplate !== null || driveConfigured === false
          }
        >
          {fullSyncing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Sync all & publish
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleImport()}
          disabled={
            running || fullSyncing || publishing || creatingTemplate !== null || driveConfigured === false
          }
        >
          {running ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {dryRun ? "Run dry import" : "Run import"}
        </Button>
        {alRoot ? (
          <Button
            type="button"
            variant="outline"
            disabled={running || fullSyncing || publishing}
            onClick={() => void handlePublishSubtree(alRoot.id, "A/L Past Papers")}
          >
            Publish A/L subtree
          </Button>
        ) : null}
        {olRoot ? (
          <Button
            type="button"
            variant="outline"
            disabled={running || fullSyncing || publishing}
            onClick={() => void handlePublishSubtree(olRoot.id, "O/L Past Papers")}
          >
            Publish O/L subtree
          </Button>
        ) : null}
      </div>

      {report ? (
        <div className="space-y-3 rounded-lg border bg-icvf-surface/40 p-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Scanned: {report.scanned}</Badge>
            <Badge variant="secondary">Created: {report.created}</Badge>
            <Badge variant="secondary">Updated: {report.updated}</Badge>
            <Badge variant="secondary">Skipped: {report.skipped}</Badge>
            <Badge variant="secondary">Folders ensured: {report.foldersEnsured}</Badge>
            <Badge variant={report.unmatched.length > 0 ? "destructive" : "secondary"}>
              Unmatched: {report.unmatched.length}
            </Badge>
          </div>
          {report.unmatched.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 pr-2">Name</th>
                    <th className="py-1 pr-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {report.unmatched.map((row) => (
                    <tr key={`${row.driveUrl}-${row.reason}`} className="border-b border-dashed">
                      <td className="py-1 pr-2 align-top">{row.driveName}</td>
                      <td className="py-1 text-muted-foreground">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
