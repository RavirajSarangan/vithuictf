"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  CanvaSlideViewer,
  getCanvaExternalUrl,
} from "@/components/student/canva-slide-viewer";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { Button } from "@/components/ui/button";
import { useStudentSessionSlide } from "@/hooks/use-academics";

function formatSessionDate(value: string): string {
  try {
    return format(parseISO(value), "EEEE, MMM d, yyyy");
  } catch {
    return value;
  }
}

export default function StudentSessionSlidesPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { session, loading, notFound } = useStudentSessionSlide(sessionId);

  if (loading) {
    return <StudentPageLoading rows={1} />;
  }

  if (notFound || !session?.canvaSlideUrl) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
        <StudentPageHeader title="Class slides" />
        <StudentEmptyState message="These slides are not available. They may have been removed or you may not have access to this class." />
        <Button
          nativeButton={false}
          variant="outline"
          className="w-fit rounded-xl"
          render={<Link href="/calendar" />}
        >
          <ArrowLeft className="size-4" />
          Back to calendar
        </Button>
      </div>
    );
  }

  const slideTitle =
    session.canvaSlideTitle?.trim() || `Class ${session.sessionNumber} slides`;
  const externalUrl = getCanvaExternalUrl(session.canvaSlideUrl);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title={slideTitle}
        description={`${session.batchName ?? "Batch"} · Class ${session.sessionNumber} · ${formatSessionDate(session.scheduledDate)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {externalUrl ? (
              <Button
                variant="outline"
                nativeButton={false}
                className="rounded-xl"
                render={
                  <a href={externalUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Open in Canva
                  </a>
                }
              />
            ) : null}
            <Button
              variant="outline"
              nativeButton={false}
              className="rounded-xl"
              render={<Link href="/calendar" />}
            >
              <ArrowLeft className="size-4" />
              Calendar
            </Button>
          </div>
        }
      />
      <CanvaSlideViewer url={session.canvaSlideUrl} title={slideTitle} />
    </div>
  );
}
