"use client";

import {
  MarketingSessionActions,
  type MarketingSessionActionsProps,
} from "@/components/landing/marketing-session-actions";

export function MarketingSessionActionsWithAuth(props: MarketingSessionActionsProps) {
  return <MarketingSessionActions {...props} />;
}
