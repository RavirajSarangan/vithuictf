"use client";

import { Clock } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { GlassCard } from "@/components/shared/glass-card";

export function RegistrationPendingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <GlassCard className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Clock className="size-6 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-xl font-semibold">Registration under review</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for registering with {BRAND.name}. Our team is reviewing your application and
          will enroll you in the right batch once approved. A confirmation email has been sent to
          your inbox. You will receive a welcome email when your account is ready.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Questions? Contact us through the website inquiry form.
        </p>
      </GlassCard>
    </div>
  );
}

export function RegistrationRejectedScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <GlassCard className="max-w-md p-8 text-center">
        <h1 className="font-heading text-xl font-semibold">Registration not approved</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your registration could not be approved at this time. Please contact {BRAND.name} support
          if you believe this is an error.
        </p>
      </GlassCard>
    </div>
  );
}
