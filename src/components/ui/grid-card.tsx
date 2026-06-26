import type { ComponentProps } from "react";

import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

const DEFAULT_PATTERN: [number, number][] = [
  [8, 2],
  [9, 4],
  [7, 3],
  [10, 1],
  [8, 5],
];

export function GridCard({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group relative isolate z-0 flex h-full flex-col justify-between overflow-hidden rounded-sm border bg-background px-5 py-4 transition-colors duration-75",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0">
        <div className="absolute -inset-[25%] -skew-y-12 [mask-image:linear-gradient(225deg,black,transparent)]">
          <GridPattern
            width={30}
            height={30}
            x={0}
            y={0}
            squares={DEFAULT_PATTERN}
            className="absolute inset-0 size-full translate-y-2 fill-border/50 stroke-border transition-transform duration-150 ease-out group-hover:translate-y-0"
          />
        </div>
        <div
          className={cn(
            "absolute -inset-[10%] opacity-0 blur-[50px] transition-opacity duration-150 group-hover:opacity-10",
            "bg-[conic-gradient(#F5A623_0deg,#F5A623_117deg,#273461_180deg,#5182FC_240deg,#F5A623_360deg)]"
          )}
        />
      </div>
      {children}
    </div>
  );
}
