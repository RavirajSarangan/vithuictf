import { Skeleton } from "@/components/ui/skeleton";

export default function AuthRouteLoading() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="hidden min-h-screen w-1/2 bg-icvf-navy/5 lg:block">
        <div className="flex h-full flex-col justify-center gap-4 p-14">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-6 w-full max-w-sm rounded-lg" />
          <Skeleton className="h-6 w-full max-w-md rounded-lg" />
        </div>
      </div>
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-8 sm:px-10 lg:w-1/2 lg:px-14 lg:py-12">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
