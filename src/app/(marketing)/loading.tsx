import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingRouteLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
