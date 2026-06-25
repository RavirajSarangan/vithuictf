"use client";

import { useStudentData } from "@/hooks/use-data";
import { BRAND } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Resource } from "@/types";

interface ResourceViewerProps {
  resource: Resource;
  onClose: () => void;
}

export function ResourceViewer({ resource, onClose }: ResourceViewerProps) {
  const student = useStudentData();
  const watermark = `${BRAND.name} — ${student?.displayName ?? "Student"} — ${student?.studentId ?? ""}`;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{resource.title}</DialogTitle>
        </DialogHeader>
        <div className="relative min-h-[400px] overflow-hidden rounded-lg bg-icvf-surface">
          {resource.type === "video" ? (
            <div className="flex h-[400px] items-center justify-center bg-icvf-navy-dark">
              <div className="text-center text-white">
                <p className="text-lg font-semibold">Protected Video Player</p>
                <p className="mt-2 text-sm text-white/60">Streaming: {resource.title}</p>
                <p className="mt-4 text-xs text-white/40">Download disabled • View only</p>
              </div>
            </div>
          ) : (
            <div className="relative flex h-[400px] items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-semibold text-icvf-navy">PDF Viewer</p>
                <p className="mt-2 text-sm text-icvf-text-light">{resource.title}</p>
                <p className="mt-4 text-xs text-icvf-text-light">View only — Download disabled</p>
              </div>
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10"
                style={{ transform: "rotate(-30deg)" }}
              >
                <p className="text-2xl font-bold text-icvf-navy whitespace-nowrap">{watermark}</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-icvf-navy/90 px-4 py-2 text-center text-xs text-white/70">
            {watermark}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
