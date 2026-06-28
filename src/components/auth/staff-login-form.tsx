"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authFieldClassName } from "@/components/auth/auth-field-styles";
import { PasswordField } from "@/components/auth/password-field";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { loginStaffPortal } from "@/lib/actions/auth";
import { BRAND } from "@/lib/constants";
import { isLoginErrorCode } from "@/lib/auth/login-errors";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const loginInputClassName = authFieldClassName;

export function StaffLoginForm() {
  const [staffUsername, setStaffUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const router = useRouter();
  const { t } = useMarketingText();

  const loginErrorKeyMap = {
    INVALID_EMAIL: "auth.invalidEmail",
    STUDENT_ID_INVALID: "auth.studentIdInvalid",
    STUDENT_ID_NOT_FOUND: "auth.studentIdNotFound",
    STAFF_USERNAME_INVALID: "auth.staffUsernameInvalid",
    STAFF_USERNAME_NOT_FOUND: "auth.staffUsernameNotFound",
    STAFF_EMAIL_MISMATCH: "auth.staffEmailMismatch",
    STAFF_PORTAL_ONLY: "auth.staffPortalOnly",
    ADMIN_PORTAL_ONLY: "auth.adminPortalOnly",
    ADMIN_USE_ADMIN_LOGIN: "auth.adminUseAdminLogin",
    STAFF_EMAIL_ONLY: "auth.staffEmailOnly",
    CONTENT_TEAM_ONLY: "auth.contentTeamOnly",
    PAPER_CENTER_ONLY: "auth.paperCenterOnly",
    STUDENT_ID_ONLY: "auth.studentIdOnly",
  } as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginStaffPortal(
        staffUsername.trim(),
        email.trim().toLowerCase(),
        password
      );

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
        <h1 className="text-2xl font-bold text-icvf-navy sm:text-3xl">{t("auth.staffPortalLogin")}</h1>
        <p className="mt-2 text-sm text-icvf-text-light sm:text-base">{t("auth.signInSubStaffPortal")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="staffUsername" className="text-sm font-semibold text-icvf-navy">
            {t("auth.staffUsername")}{" "}
            <span className="font-normal text-icvf-text-light">({t("auth.optionalForAdmins")})</span>
          </Label>
          <Input
            id="staffUsername"
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={staffUsername}
            onChange={(e) => setStaffUsername(e.target.value)}
            className={loginInputClassName}
            placeholder={t("auth.staffUsernamePlaceholder")}
            autoComplete="username"
          />
        </div>

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
          href={`mailto:${BRAND.contact.email}?subject=Staff%20access%20request`}
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
