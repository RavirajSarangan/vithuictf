"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { authFieldClassName } from "@/components/auth/auth-field-styles";
import { PasswordField } from "@/components/auth/password-field";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { BRAND } from "@/lib/constants";
import { EMAIL_PATTERN, isLoginErrorCode } from "@/lib/auth/login-errors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SOCIAL_TRACKING_REDIRECT = "/staff/tracking";
const loginInputClassName = authFieldClassName;

export function ContentTeamLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInAsContentTeam } = useAuth();
  const router = useRouter();
  const { t } = useMarketingText();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        toast.error(t("auth.invalidEmail"));
        return;
      }

      await signInAsContentTeam(normalizedEmail, password);
      router.replace(SOCIAL_TRACKING_REDIRECT);
      toast.success(t("auth.loginSuccess"));
    } catch (err) {
      if (err instanceof Error && isLoginErrorCode(err.message)) {
        const keyMap = {
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
        toast.error(t(keyMap[err.message]));
      } else {
        toast.error(err instanceof Error ? err.message : t("auth.loginFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-icvf-navy sm:text-3xl">{t("auth.socialTrackingLogin")}</h1>
        <p className="mt-2 text-sm text-icvf-text-light sm:text-base">{t("auth.signInSubSocialTracking")}</p>
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

      <p className="mt-8 text-center text-sm text-icvf-text-light">
        {t("auth.needHelp")}{" "}
        <a
          href={`mailto:${BRAND.contact.email}?subject=Social%20tracking%20access%20request`}
          className="font-semibold text-icvf-navy hover:text-icvf-accent hover:underline"
        >
          {BRAND.contact.email}
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
