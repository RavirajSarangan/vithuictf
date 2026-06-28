"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  resetCertificateTemplateToDefault,
  uploadCertificateTemplate,
} from "@/lib/actions/certificates";
import { DEFAULT_CERTIFICATE_TEMPLATE_PATH } from "@/lib/certificates/field-config";
import type { CertificateTemplate } from "@/types";

interface CertificateTemplatePanelProps {
  template: CertificateTemplate | null;
  onUpdated: () => void;
}

export function CertificateTemplatePanel({ template, onUpdated }: CertificateTemplatePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const previewUrl = encodeURI(template?.imageUrl ?? DEFAULT_CERTIFICATE_TEMPLATE_PATH);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", file.name.replace(/\.[^.]+$/, ""));
      const result = await uploadCertificateTemplate(formData);
      if (!result.ok) throw new Error(result.error);
      toast.success("Template uploaded and activated");
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const result = await resetCertificateTemplateToDefault();
      if (!result.ok) throw new Error(result.error);
      toast.success("Reset to default ICTF template");
      onUpdated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Active template</CardTitle>
          <CardDescription>
            This image is used for every generated certificate. ID prefix:{" "}
            <span className="font-mono">{template?.idPrefix ?? "foc-cert-2026"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative aspect-[1.414/1] overflow-hidden rounded-lg border bg-muted/30 [content-visibility:auto]">
            <Image
              src={previewUrl}
              alt="Certificate template preview"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
              Upload new template
            </Button>
            <Button variant="outline" disabled={resetting} onClick={() => void handleReset()}>
              {resetting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RotateCcw className="mr-2 size-4" />}
              Use default ICTF template
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-filled fields</CardTitle>
          <CardDescription>These positions are overlaid on the template when certificates are generated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="font-medium">Certificate ID</p>
            <p className="text-muted-foreground">Top right — e.g. foc-cert-2026-001</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Student name</p>
            <p className="text-muted-foreground">Center — script style with gradient</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Course name</p>
            <p className="text-muted-foreground">Bold title below the distinction line</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Course description</p>
            <p className="text-muted-foreground">Paragraph text updates with the course name you enter</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Issue date</p>
            <p className="text-muted-foreground">Bottom right — DD.MM.YYYY format</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
