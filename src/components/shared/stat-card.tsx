import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  accent?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, className, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-icvf-border bg-white p-6 shadow-sm",
        accent && "border-icvf-accent/30 bg-gradient-to-br from-icvf-navy to-icvf-navy-dark text-white",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn("text-sm font-medium", accent ? "text-white/70" : "text-icvf-text-light")}>{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className={cn("mt-1 text-sm", accent ? "text-white/60" : "text-icvf-text-light")}>{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-xl p-3", accent ? "bg-icvf-accent/20" : "bg-icvf-navy/10")}>
            <Icon className={cn("size-5", accent ? "text-icvf-accent" : "text-icvf-navy")} />
          </div>
        )}
      </div>
    </div>
  );
}
