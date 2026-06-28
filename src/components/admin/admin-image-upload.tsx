"use client";

import { useRef, useState } from "react";
import { uploadAdminAsset } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AdminImageUploadProps {
  label: string;
  value: string;
  folder?: string;
  onChange: (url: string) => void;
  uploadAction?: (formData: FormData) => Promise<string>;
  requireSquare?: boolean;
  hint?: string;
}

export function AdminImageUpload({
  label,
  value,
  folder = "home",
  onChange,
  uploadAction = uploadAdminAsset,
  requireSquare = false,
  hint,
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      if (requireSquare) {
        const { validateSquareImageFile } = await import("@/lib/images/validate-square-image");
        await validateSquareImageFile(file);
      }
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", folder);
      const url = await uploadAction(formData);
      onChange(url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {value ? (
        <div className="relative size-24 overflow-hidden rounded-lg border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </div>
  );
}
