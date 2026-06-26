import Image from "next/image";
import { Lock } from "lucide-react";
import { COMPLIANCE_BADGE_ASSETS } from "@/lib/compliance-badges";
import { cn } from "@/lib/utils";

interface SecurityComplianceBadgesProps {
  variant?: "login" | "marketing" | "portal";
  showSecureText?: boolean;
  secureText?: string;
  className?: string;
}

function ComplianceBadgeImage({
  badge,
  className,
  loading,
}: {
  badge: (typeof COMPLIANCE_BADGE_ASSETS)[number];
  className?: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <Image
      src={badge.src}
      alt={badge.alt}
      width={badge.width}
      height={badge.height}
      loading={loading}
      className={cn("h-auto w-auto max-w-full object-contain", className)}
    />
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

  const badgeHeight =
    variant === "login"
      ? "h-11 sm:h-12"
      : variant === "portal"
        ? "h-12 sm:h-14"
        : "h-12 sm:h-14 md:h-16";

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

      <div
        className={cn(
          "flex w-full flex-wrap items-center justify-center gap-5 sm:gap-7 md:gap-8",
          variant === "login" && "max-w-lg",
          variant === "marketing" && "max-w-3xl",
          variant === "portal" && "max-w-2xl"
        )}
      >
        {COMPLIANCE_BADGE_ASSETS.map((badge) => (
          <ComplianceBadgeImage
            key={badge.src}
            badge={badge}
            className={badgeHeight}
            loading={variant === "marketing" ? "lazy" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export { COMPLIANCE_BADGE_ASSETS };
