"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth, getRoleRedirect } from "@/providers/auth-provider";
import { authFieldClassName } from "@/components/auth/auth-field-styles";
import { PasswordField } from "@/components/auth/password-field";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { BRAND } from "@/lib/constants";
import { isLoginErrorCode } from "@/lib/auth/login-errors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const loginInputClassName = authFieldClassName;

type PublicLoginTab = "studentId" | "staffLink";

export function StudentLoginForm() {
  const [activeTab, setActiveTab] = useState<PublicLoginTab>("studentId");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithStudentId } = useAuth();
  const router = useRouter();
  const { t } = useMarketingText();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await signInWithStudentId(studentId, password);
      router.replace(getRoleRedirect(user.role));
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
        <h1 className="text-2xl font-bold text-icvf-navy sm:text-3xl">{t("auth.welcomeBack")}</h1>
        <p className="mt-2 text-sm text-icvf-text-light sm:text-base">
          {activeTab === "studentId" ? t("auth.signInSub") : t("auth.signInSubStaffLink")}
        </p>
      </div>

      <div
        className="mb-6 grid w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1"
        role="tablist"
        aria-label={t("auth.signInHeading")}
      >
        {(
          [
            { id: "studentId" as const, labelKey: "auth.studentId" as const, icon: GraduationCap },
            { id: "staffLink" as const, labelKey: "auth.staffPortalLogin" as const, icon: ShieldCheck },
          ] as const
        ).map(({ id, labelKey, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-white text-icvf-navy shadow-sm ring-1 ring-black/[0.04]"
                  : "text-icvf-text-light hover:text-icvf-navy"
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-icvf-accent" : "text-current")} aria-hidden />
              <span className="truncate">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "studentId" ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="studentId" className="text-sm font-semibold text-icvf-navy">
              {t("auth.studentId")}
            </Label>
            <Input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={loginInputClassName}
              placeholder={t("auth.studentIdPlaceholder")}
              autoComplete="username"
              required
            />
            <p className="text-xs leading-relaxed text-icvf-text-light">
              {t("auth.studentIdMissingHelp")}{" "}
              <a
                href={`mailto:${BRAND.contact.email}?subject=Student%20ID%20request`}
                className="font-medium text-icvf-navy hover:text-icvf-accent hover:underline"
              >
                {BRAND.contact.email}
              </a>
            </p>
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
      ) : (
        <div className="flex flex-col gap-5 rounded-2xl border border-icvf-border bg-slate-50/80 p-6">
          <p className="text-sm leading-relaxed text-icvf-text-light">{t("auth.staffDedicatedLoginHelp")}</p>
          <Link
            href="/login/staff"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-icvf-accent text-base font-semibold text-white transition-colors hover:bg-icvf-accent-hover"
          >
            {t("auth.continueToStaffLogin")}
          </Link>
        </div>
      )}

      <p className="mt-5 text-center">
        <a
          href={`mailto:${BRAND.contact.email}?subject=Password%20reset%20request`}
          className="text-sm font-medium text-icvf-navy hover:text-icvf-accent hover:underline"
        >
          {t("auth.forgotPassword")}
        </a>
      </p>

      {activeTab === "studentId" ? (
        <p className="mt-8 text-center text-sm text-icvf-text-light">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-semibold text-icvf-navy hover:text-icvf-accent hover:underline">
            {t("auth.createAccount")}
          </Link>
        </p>
      ) : null}

      <SecurityComplianceBadges
        variant="login"
        showSecureText
        secureText={t("auth.secureLogin")}
        className="mt-10 border-t border-icvf-border pt-8"
      />
    </>
  );
}
