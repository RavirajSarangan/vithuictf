"use client";

import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { usePaperCenterStaffProfile, useStaffExamPaperBatches } from "@/hooks/use-exam-papers";
import { ClipboardCheck, FileText, MapPin, Upload, User } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function PaperCenterDashboardPage() {
  const { staff, loading: staffLoading } = usePaperCenterStaffProfile();
  const { batches, loading: batchesLoading } = useStaffExamPaperBatches();

  const totalPapers = batches.reduce((sum, batch) => sum + batch.paperCount, 0);
  const recentBatches = batches.slice(0, 5);

  if (staffLoading) {
    return <StudentPageLoading rows={3} />;
  }

  if (!staff) {
    return (
      <p className="text-sm text-destructive">
        Your paper center profile could not be loaded. Contact an administrator.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${staff.paperCenterName ?? "Paper Center"} Dashboard`}
        description={`Welcome, ${staff.displayName}. Upload and track exam papers for your center.`}
        action={
          <Link href="/paper-center/upload" className={buttonVariants({ variant: "default" })}>
            <Upload className="mr-2 size-4" />
            Upload papers
          </Link>
        }
      />

      <div className="grid gap-4 rounded-xl border bg-gradient-to-br from-icvf-navy/5 to-transparent p-5 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 text-icvf-navy" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Center</p>
            <p className="text-lg font-semibold text-icvf-navy">{staff.paperCenterName ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{staff.place ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <User className="mt-0.5 size-5 text-icvf-navy" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Staff account</p>
            <p className="text-lg font-semibold text-icvf-navy">{staff.displayName}</p>
            <p className="text-sm text-muted-foreground">@{staff.staffUsername}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upload batches</CardTitle>
            <ClipboardCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{batchesLoading ? "—" : batches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Papers uploaded</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{batchesLoading ? "—" : totalPapers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Latest upload</CardTitle>
            <Upload className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {batchesLoading || batches.length === 0 ? "—" : formatDate(batches[0]!.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent uploads</CardTitle>
          <Link href="/paper-center/history" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {batchesLoading ? (
            <p className="text-sm text-muted-foreground">Loading uploads…</p>
          ) : recentBatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploads yet. Start by uploading exam papers.</p>
          ) : (
            <div className="space-y-3">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-icvf-navy">
                      {batch.paperCount} paper{batch.paperCount === 1 ? "" : "s"}
                      {batch.examYear ? ` · ${batch.examYear}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDate(batch.createdAt)}</p>
                  </div>
                  <BadgeRow batch={batch} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BadgeRow({ batch }: { batch: { medium: string | null; examType: string } }) {
  const parts = [batch.medium, batch.examType?.toUpperCase()].filter(Boolean);
  if (parts.length === 0) return null;
  return <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>;
}
