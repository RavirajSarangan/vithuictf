"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalShellLoading } from "@/components/layout/portal-shell-loading";
import { getRoleRedirect, useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types";

interface PortalAuthGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  loginHref: string;
}

export function PortalAuthGate({ children, allowedRoles, loginHref }: PortalAuthGateProps) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  const roleAllowed = user ? allowedRoles.includes(user.role) : false;

  useEffect(() => {
    if (!initialized || loading) return;

    if (!user) {
      setRedirecting(true);
      router.replace(loginHref);
      return;
    }

    if (!roleAllowed) {
      setRedirecting(true);
      router.replace(getRoleRedirect(user.role));
    }
  }, [user, loading, initialized, roleAllowed, loginHref, router]);

  if (!initialized || loading || redirecting || !user || !roleAllowed) {
    return <PortalShellLoading rows={2} />;
  }

  return <>{children}</>;
}
