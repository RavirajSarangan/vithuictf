"use client";

import { AuthProvider } from "@/providers/auth-provider";
import {
  MarketingSessionActions,
  type MarketingSessionActionsProps,
} from "@/components/landing/marketing-session-actions";

export function MarketingSessionActionsWithAuth(props: MarketingSessionActionsProps) {
  return (
    <AuthProvider deferred>
      <MarketingSessionActions {...props} />
    </AuthProvider>
  );
}
