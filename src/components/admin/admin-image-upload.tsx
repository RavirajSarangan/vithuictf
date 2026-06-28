"use client";

import { useEffect, useRef, useState } from "react";
import { uploadAdminAsset, uploadBlogImage } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateRasterImageFile } from "@/lib/images/validate-raster-image";
import { BLOG_COVER_HEIGHT, BLOG_COVER_WIDTH } from "@/lib/images/admin-image-constants";
import { isStorageUrl, normalizeStorageUrl } from "@/lib/storage/public-url";
import { ExternalLink, ImageOff } from "lucide-react";

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
  const [previewError, setPreviewError] = useState(false);

  const resolvedPreviewAspect =
    previewAspect === "auto" && variant === "cover" ? "16/9" : previewAspect;

  const normalizedValue = normalizeStorageUrl(value);

  useEffect(() => {
    setPreviewError(false);
  }, [normalizedValue]);

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

      const normalized = normalizeStorageUrl(url);
      if (!normalized) {
        throw new Error("Upload succeeded but returned an invalid URL");
      }

      onChange(normalized);
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
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {(hint ?? defaultHint) ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint ?? defaultHint}</p>
        ) : null}
      </div>

      {normalizedValue ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border bg-muted/30",
            resolvedPreviewAspect === "16/9" && "aspect-video w-full",
            resolvedPreviewAspect === "square" && "size-28",
            resolvedPreviewAspect === "auto" && "min-h-40 w-full"
          )}
        >
          {!previewError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={normalizedValue}
              src={normalizedValue}
              alt="Uploaded preview"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setPreviewError(true)}
              onLoad={() => setPreviewError(false)}
            />
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
              <ImageOff className="size-8 opacity-60" />
              <p>Preview could not load this image URL.</p>
              <a
                href={normalizedValue}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-icvf-accent hover:underline"
              >
                Open URL
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => onChange(normalizeStorageUrl(e.target.value) || e.target.value.trim())}
          placeholder="https://..."
          className="min-w-0 flex-1 font-mono text-xs sm:text-sm"
        />
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
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="shrink-0"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>

      {normalizedValue && !isStorageUrl(normalizedValue) ? (
        <p className="text-xs text-amber-700">
          Use an https image URL or upload a file to ICTF storage for reliable previews.
        </p>
      ) : null}
    </div>
  );
}
