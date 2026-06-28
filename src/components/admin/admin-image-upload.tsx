"use client";

import { useRef, useState } from "react";
import { uploadAdminAsset, uploadBlogImage } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateRasterImageFile } from "@/lib/images/validate-raster-image";
import { BLOG_COVER_HEIGHT, BLOG_COVER_WIDTH } from "@/lib/images/admin-image-constants";

interface AdminImageUploadProps {
  label: string;
  value: string;
  folder?: string;
  onChange: (url: string) => void;
  uploadAction?: (formData: FormData) => Promise<string>;
  requireSquare?: boolean;
  hint?: string;
  variant?: "cover" | "content" | "default";
  previewAspect?: "16/9" | "square" | "auto";
}

export function AdminImageUpload({
  label,
  value,
  folder = "home",
  onChange,
  uploadAction,
  requireSquare = false,
  hint,
  variant = "default",
  previewAspect = "auto",
}: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const resolvedPreviewAspect =
    previewAspect === "auto" && variant === "cover" ? "16/9" : previewAspect;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      if (requireSquare) {
        const { validateSquareImageFile } = await import("@/lib/images/validate-square-image");
        await validateSquareImageFile(file);
      } else if (variant === "cover" || variant === "content") {
        await validateRasterImageFile(file);
      }

      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", folder);
      if (variant === "cover" || variant === "content") {
        formData.set("variant", variant);
      }

      const url = uploadAction
        ? await uploadAction(formData)
        : variant === "cover" || variant === "content"
          ? await uploadBlogImage(formData)
          : await uploadAdminAsset(formData);

      onChange(url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const defaultHint =
    variant === "cover"
      ? `Recommended ${BLOG_COVER_WIDTH}×${BLOG_COVER_HEIGHT}px (16:9). Images are auto-cropped and optimized.`
      : undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {(hint ?? defaultHint) ? (
        <p className="text-xs text-muted-foreground">{hint ?? defaultHint}</p>
      ) : null}
      {value ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border bg-muted/30",
            resolvedPreviewAspect === "16/9" && "aspect-video w-full max-w-lg",
            resolvedPreviewAspect === "square" && "size-24",
            resolvedPreviewAspect === "auto" && "max-h-48 w-full max-w-lg"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
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
