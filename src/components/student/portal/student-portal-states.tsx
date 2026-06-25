import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StudentPageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-icvf-navy sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-icvf-text-light">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StudentEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-icvf-border bg-icvf-surface/60 px-4 py-10 text-center sm:py-12">
      <p className="max-w-sm text-sm text-icvf-text-light">{message}</p>
    </div>
  );
}

export function StudentPageLoading({ rows = 2 }: { rows?: number }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <Skeleton className="h-14 w-full max-w-md rounded-xl" />
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl sm:h-64" />
        ))}
      </div>
    </div>
  );
}
