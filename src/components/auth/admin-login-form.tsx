"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdminPortal } from "@/lib/actions/auth";
import { authFieldClassName } from "@/components/auth/auth-field-styles";
import { PasswordField } from "@/components/auth/password-field";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { BRAND } from "@/lib/constants";
import { isLoginErrorCode } from "@/lib/auth/login-errors";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const loginInputClassName = authFieldClassName;

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const router = useRouter();
  const { t } = useMarketingText();

  const loginErrorKeyMap = {
    INVALID_EMAIL: "auth.invalidEmail",
    STAFF_PORTAL_ONLY: "auth.staffPortalOnly",
    ADMIN_PORTAL_ONLY: "auth.adminPortalOnly",
  } as const;

  useEffect(() => {
    const prefill = searchParams.get("email")?.trim().toLowerCase();
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await loginAdminPortal(normalizedEmail, password);

      if (!result.ok) {
        if (result.code && isLoginErrorCode(result.code) && result.code in loginErrorKeyMap) {
          toast.error(t(loginErrorKeyMap[result.code as keyof typeof loginErrorKeyMap]));
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
      toast.success(t("auth.loginSuccess"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-icvf-navy sm:text-3xl">{t("auth.adminPortalLogin")}</h1>
        <p className="mt-2 text-sm text-icvf-text-light sm:text-base">{t("auth.signInSubAdminPortal")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-semibold text-icvf-navy">
            {t("auth.email")}
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={loginInputClassName}
            placeholder={t("auth.emailPlaceholder")}
            autoComplete="email"
            required
          />
        </div>

        <PasswordField
          id="password"
          label={t("auth.password")}
          value={password}
          onChange={setPassword}
          required
          inputClassName={cn(loginInputClassName, "pr-11")}
          placeholder={t("auth.passwordPlaceholder")}
        />

        <Button
          type="submit"
          variant="icvf"
          className="mt-1 h-12 w-full rounded-xl text-base font-semibold"
          disabled={loading}
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>

      <p className="mt-5 text-center">
        <a
          href={`mailto:${BRAND.contact.email}?subject=Admin%20access%20request`}
          className="text-sm font-medium text-icvf-navy hover:text-icvf-accent hover:underline"
        >
          {t("auth.needHelp")} {BRAND.contact.email}
        </a>
      </p>

      <SecurityComplianceBadges
        variant="login"
        showSecureText
        secureText={t("auth.secureLogin")}
        className="mt-10 border-t border-icvf-border pt-8"
      />
    </>
  );
}
