import Image from "next/image";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPLIANCE_BADGES = [
  {
    icon: "/compliance/icons/pdpa.svg",
    title: "PDPA",
    subtitle: "Compliance",
    alt: "PDPA Compliance",
  },
  {
    icon: "/compliance/icons/iso-27001.svg",
    title: "ISO 27001",
    subtitle: "Certified",
    alt: "ISO 27001 Certified",
  },
  {
    icon: "/compliance/icons/pci-dss.svg",
    title: "PCI DSS",
    subtitle: "Certified",
    alt: "PCI DSS Certified",
  },
] as const;

const PORTAL_SEALS = [
  { src: "/compliance/pdpa-badge.svg", alt: "PDPA Compliance" },
  { src: "/compliance/iso-27001-badge.svg", alt: "ISO 27001 Certified" },
  { src: "/compliance/pci-dss-badge.svg", alt: "PCI DSS Certified" },
] as const;

interface SecurityComplianceBadgesProps {
  variant?: "login" | "marketing" | "portal";
  showSecureText?: boolean;
  secureText?: string;
  className?: string;
}

function ComplianceBadgeStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[520px] flex-col gap-2 rounded-2xl bg-icvf-navy-dark px-2 py-2 sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5",
        className
      )}
    >
      {COMPLIANCE_BADGES.map((badge) => (
        <div
          key={badge.title}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-icvf-accent/45 bg-icvf-navy px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-icvf-accent p-1.5 sm:size-11">
            <Image
              src={badge.icon}
              alt=""
              width={64}
              height={64}
              unoptimized
              aria-hidden
              className="size-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-white">{badge.title}</p>
            <p className="truncate text-[11px] leading-tight text-white/55">{badge.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SecurityComplianceBadges({
  variant = "marketing",
  showSecureText = false,
  secureText = "Secure 256-bit SSL encryption",
  className,
}: SecurityComplianceBadgesProps) {
  const secureTextClass =
    variant === "marketing" ? "text-white/55" : "text-icvf-text-light";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        variant === "portal" && "border-t border-icvf-border pt-6",
        className
      )}
    >
      {showSecureText ? (
        <p className={cn("flex items-center gap-1.5 text-xs", secureTextClass)}>
          <Lock className="size-3.5 shrink-0 text-icvf-accent" aria-hidden />
          {secureText}
        </p>
      ) : null}

      {variant === "portal" ? (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {PORTAL_SEALS.map((seal) => (
            <Image
              key={seal.alt}
              src={seal.src}
              alt={seal.alt}
              width={120}
              height={120}
              unoptimized
              className="size-16 object-contain sm:size-[4.5rem]"
            />
          ))}
        </div>
      ) : (
        <ComplianceBadgeStrip className={variant === "login" ? "max-w-[420px]" : "max-w-md"} />
      )}
    </div>
  );
}
