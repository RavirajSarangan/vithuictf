import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import { Skeleton } from "@/components/ui/skeleton";

const SIDEBAR_LINK_COUNT = 6;
const MOBILE_TAB_COUNT = 4;

export function PortalShellLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        aria-hidden
        className="hidden w-[var(--sidebar-width,16rem)] shrink-0 flex-col border-r border-white/10 bg-icvf-navy md:flex"
      >
        <div className="border-b border-white/10 px-4 py-5">
          <Skeleton className="h-8 w-28 rounded-lg bg-white/15" />
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 py-4">
          {Array.from({ length: SIDEBAR_LINK_COUNT }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-xl bg-white/10" />
          ))}
        </div>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <Skeleton className="size-9 shrink-0 rounded-full bg-white/15" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-24 rounded bg-white/15" />
              <Skeleton className="h-3 w-32 rounded bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-xl bg-white/10" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-icvf-surface">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-icvf-border bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 rounded-xl md:hidden" />
            <Skeleton className="h-6 w-32 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-28 md:p-6 md:pb-6">
          <StudentPageLoading rows={rows} />
        </main>
      </div>

      <nav
        aria-hidden
        className="fixed inset-x-0 bottom-0 z-50 border-t border-icvf-border bg-white pb-[env(safe-area-inset-bottom,0px)] pt-1 md:hidden"
      >
        <div className="flex px-1">
          {Array.from({ length: MOBILE_TAB_COUNT }).map((_, index) => (
            <div key={index} className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 py-2">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-2 w-10 rounded" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
