"use client";

import { AuthLoginShell } from "@/components/auth/auth-login-shell";

export default function StaffLoginPage() {
  return (
    <main>
      <AuthLoginShell defaultLoginMode="staff" />
    </main>
  );
}
