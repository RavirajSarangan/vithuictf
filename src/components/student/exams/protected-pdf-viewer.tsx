"use client";

import { useEffect, useRef, useState } from "react";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, ZoomIn, ZoomOut } from "lucide-react";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

/**
 * Canvas-rendered PDF viewer (pdfjs-dist), not a native <iframe>/<embed> — the
 * browser's built-in PDF plugin has its own toolbar/download button that page
 * JS cannot suppress. Deterrence below (no download link, blocked right-click/
 * copy/print, Ctrl/Cmd+S/P intercepted) is best-effort only: it stops casual
 * copying, not a screenshot or a phone camera.
 */
export function ProtectedPdfViewer({ signedUrlEndpoint }: { signedUrlEndpoint: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.1);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const docRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(signedUrlEndpoint);
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to load question paper");

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const doc = await pdfjs.getDocument({ url: data.url }).promise;
        if (cancelled) {
          void doc.destroy();
          return;
        }
        docRef.current = doc;
        setPageCount(doc.numPages);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(getActionErrorMessage(err, "Failed to load question paper"));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      void docRef.current?.destroy();
      docRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedUrlEndpoint]);

  useEffect(() => {
    const doc = docRef.current;
    const container = containerRef.current;
    if (!doc || !container || loading) return;

    let cancelled = false;

    void (async () => {
      container.innerHTML = "";
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        if (cancelled) return;
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "mx-auto mb-3 max-w-full rounded-lg border border-icvf-border shadow-sm";

        const context = canvas.getContext("2d");
        if (!context) continue;

        await page.render({ canvas, canvasContext: context, viewport }).promise;
        if (cancelled) return;
        container.appendChild(canvas);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scale, pageCount, loading]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
        <ShieldAlert className="size-6 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <style>{`@media print { .protected-pdf-viewer { display: none !important; } }`}</style>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-icvf-border bg-icvf-surface/60 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {loading ? "Loading…" : `${pageCount} page${pageCount === 1 ? "" : "s"}`} · view only
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            disabled={loading || scale <= MIN_SCALE}
            onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - 0.15).toFixed(2)))}
          >
            <ZoomOut className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            disabled={loading || scale >= MAX_SCALE}
            onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + 0.15).toFixed(2)))}
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-icvf-border bg-white">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="protected-pdf-viewer max-h-[70vh] select-none overflow-y-auto rounded-xl border border-icvf-border bg-icvf-surface/40 p-3 [-webkit-user-select:none]"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          const key = e.key.toLowerCase();
          if ((e.ctrlKey || e.metaKey) && (key === "s" || key === "p")) {
            e.preventDefault();
          }
        }}
        tabIndex={0}
      />
    </div>
  );
}
