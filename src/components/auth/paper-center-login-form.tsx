"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authFieldClassName } from "@/components/auth/auth-field-styles";
import { PasswordField } from "@/components/auth/password-field";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginPaperCenterPortal } from "@/lib/actions/auth";
import { isLoginErrorCode } from "@/lib/auth/login-errors";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const loginInputClassName = authFieldClassName;

const loginErrorKeyMap = {
  INVALID_EMAIL: "Invalid email address",
  STUDENT_ID_INVALID: "Invalid student ID",
  STUDENT_ID_NOT_FOUND: "Student ID not found",
  STAFF_USERNAME_INVALID: "Invalid staff username",
  STAFF_USERNAME_NOT_FOUND: "Username not found",
  STAFF_EMAIL_MISMATCH: "Email does not match username",
  STAFF_PORTAL_ONLY: "Use the staff login portal",
  ADMIN_PORTAL_ONLY: "Use the admin login portal",
  ADMIN_USE_ADMIN_LOGIN: "Use the admin login portal",
  STAFF_EMAIL_ONLY: "Staff must sign in with email",
  CONTENT_TEAM_ONLY: "Use the content team login portal",
  PAPER_CENTER_ONLY: "Use the paper center login portal",
  STUDENT_ID_ONLY: "Use the student login portal",
} as const;

export function PaperCenterLoginForm({
  centerName,
  centerSlug,
}: {
  centerName?: string;
  centerSlug?: string;
}) {
  const [staffUsername, setStaffUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginPaperCenterPortal(staffUsername.trim(), password, centerSlug);

      if (!result.ok) {
        if (result.code && isLoginErrorCode(result.code) && result.code in loginErrorKeyMap) {
          toast.error(loginErrorKeyMap[result.code as keyof typeof loginErrorKeyMap]);
        } else {
          toast.error(result.error);
        }
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
        return;
      }

      await refreshUser();
      router.replace(result.redirectTo);
      toast.success("Signed in successfully");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-icvf-navy sm:text-3xl">
          {centerName ? `${centerName} Portal` : "Paper Center Portal"}
        </h1>
        <p className="mt-2 text-sm text-icvf-text-light sm:text-base">
          {centerName
            ? `Sign in with your ${centerName} username and password to upload student exam papers.`
            : "Sign in with the username and password provided by your administrator to upload student exam papers."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="paper-center-username">Username</Label>
          <Input
            id="paper-center-username"
            autoComplete="username"
            value={staffUsername}
            onChange={(e) => setStaffUsername(e.target.value)}
            className={cn(loginInputClassName)}
            required
          />
        </div>

        <PasswordField
          id="paper-center-password"
          label="Password"
          value={password}
          onChange={setPassword}
          inputClassName={loginInputClassName}
          required
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <SecurityComplianceBadges className="mt-8" />
    </>
  );
}
