import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

interface GlassCardProps extends ComponentProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-icvf-border bg-white p-4 shadow-sm sm:p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
