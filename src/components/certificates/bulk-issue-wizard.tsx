"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkIssueCertificates, previewCertificateImage } from "@/lib/actions/certificates";
import {
  detectColumnMapping,
  parseCertificateCsv,
  type CsvColumnMapping,
  type ParsedCertificateRow,
} from "@/lib/certificates/parse-csv";

const CHUNK_SIZE = 20;

interface BulkIssueWizardProps {
  onComplete: () => void;
}

type WizardStep = "upload" | "map" | "preview" | "generate" | "done";

export function BulkIssueWizard({ onComplete }: BulkIssueWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<CsvColumnMapping>>({});
  const [rows, setRows] = useState<ParsedCertificateRow[]>([]);
  const [batchName, setBatchName] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [autoSendEmail, setAutoSendEmail] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [summary, setSummary] = useState<{ success: number; failed: number } | null>(null);

  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalidCount = rows.length - validRows.length;

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    const detected = detectColumnMapping(
      (text.split("\n")[0] ?? "").split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
    );
    setMapping(detected);
    setBatchName(file.name.replace(/\.csv$/i, ""));
    setStep("map");
  };

  const applyMapping = () => {
    if (!mapping.studentName || !mapping.courseName) {
      toast.error("Map Student Name and Course Name columns");
      return;
    }
    const parsed = parseCertificateCsv(csvText, mapping as CsvColumnMapping);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setStep("preview");
  };

  const loadPreview = async () => {
    const sample = validRows[0];
    if (!sample) return;
    setPreviewLoading(true);
    try {
      const result = await previewCertificateImage({
        studentName: sample.studentName,
        courseName: sample.courseName,
        issueDate,
        certificateNumber: "foc-cert-2026-PREVIEW",
      });
      if (!result.ok) throw new Error(result.error);
      setPreviewUrl(result.dataUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (validRows.length === 0) {
      toast.error("No valid rows to generate");
      return;
    }
    setGenerating(true);
    setStep("generate");
    setProgress({ done: 0, total: validRows.length, failed: 0 });

    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);
      try {
        const result = await bulkIssueCertificates({
          batchName: `${batchName} (part ${Math.floor(i / CHUNK_SIZE) + 1})`,
          issueDate,
          autoSendEmail,
          rows: chunk.map((row) => ({
            rowIndex: row.rowIndex,
            studentName: row.studentName,
            courseName: row.courseName,
            email: row.email,
            phone: row.phone,
          })),
        });
        if (!result.ok) throw new Error("Batch failed");
        totalSuccess += result.successCount;
        totalFailed += result.failedCount;
      } catch (e) {
        totalFailed += chunk.length;
        toast.error(e instanceof Error ? e.message : "Batch generation failed");
      }
      setProgress({ done: Math.min(i + chunk.length, validRows.length), total: validRows.length, failed: totalFailed });
    }

    setSummary({ success: totalSuccess, failed: totalFailed });
    setGenerating(false);
    setStep("done");
    onComplete();
    toast.success(`Generated ${totalSuccess} certificate${totalSuccess === 1 ? "" : "s"}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5" />
              Upload CSV
            </CardTitle>
            <CardDescription>
              Columns: Student Name, Course Name, Email (optional), Phone/WhatsApp (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 transition-colors hover:bg-muted/40">
              <Upload className="size-10 text-muted-foreground" />
              <span className="font-medium">Drop CSV file or click to browse</span>
              <span className="text-sm text-muted-foreground">.csv files only</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle>Map columns</CardTitle>
            <CardDescription>Match your spreadsheet headers to certificate fields.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(["studentName", "courseName", "email", "phone"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label>
                  {field === "studentName"
                    ? "Student Name *"
                    : field === "courseName"
                      ? "Course Name *"
                      : field === "email"
                        ? "Email"
                        : "Phone / WhatsApp"}
                </Label>
                <Select
                  value={mapping[field] ?? ""}
                  onValueChange={(value) => setMapping((m) => ({ ...m, [field]: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {(csvText.split("\n")[0] ?? "")
                      .split(",")
                      .map((h) => h.trim().replace(/^"|"$/g, ""))
                      .filter(Boolean)
                      .map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex gap-2 sm:col-span-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={applyMapping}>Continue to preview</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Review rows</CardTitle>
              <CardDescription>
                {validRows.length} valid · {invalidCount} with errors · {rows.length} total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Batch name</Label>
                  <Input value={batchName} onChange={(e) => setBatchName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Issue date on certificate</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto-email"
                  checked={autoSendEmail}
                  onCheckedChange={(v) => setAutoSendEmail(v === true)}
                />
                <Label htmlFor="auto-email">Auto-send email when address is provided</Label>
              </div>
              <div className="max-h-64 overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Course</th>
                      <th className="px-3 py-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row) => (
                      <tr key={row.rowIndex} className="border-t">
                        <td className="px-3 py-2">{row.studentName || "—"}</td>
                        <td className="px-3 py-2">{row.courseName || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.email ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setStep("map")}>
                  Back
                </Button>
                <Button variant="outline" disabled={previewLoading} onClick={() => void loadPreview()}>
                  {previewLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Preview sample
                </Button>
                <Button onClick={() => void handleGenerate()} disabled={validRows.length === 0}>
                  <Sparkles className="mr-2 size-4" />
                  Generate {validRows.length} certificates
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample preview</CardTitle>
              <CardDescription>First valid row rendered on your template</CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Certificate preview" className="w-full rounded-lg border" />
              ) : (
                <div className="flex aspect-[1.414/1] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  Click &quot;Preview sample&quot; to render
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === "generate" && (
        <Card>
          <CardHeader>
            <CardTitle>Generating certificates</CardTitle>
            <CardDescription>
              {progress.done} / {progress.total} processed
              {progress.failed > 0 ? ` · ${progress.failed} failed` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
            {generating && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Compositing images and saving records…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === "done" && summary && (
        <Card>
          <CardHeader>
            <CardTitle>Batch complete</CardTitle>
            <CardDescription>
              {summary.success} issued successfully · {summary.failed} failed
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              onClick={() => {
                setStep("upload");
                setCsvText("");
                setRows([]);
                setPreviewUrl(null);
                setSummary(null);
              }}
            >
              Issue another batch
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
