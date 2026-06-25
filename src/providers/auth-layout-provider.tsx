"use client";

import { AuthProvider } from "@/providers/auth-provider";

export function AuthLayoutProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
