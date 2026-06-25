"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, getRoleRedirect } from "@/providers/auth-provider";
import { authFieldClassName } from "@/components/auth/auth-field-styles";
import { PasswordField } from "@/components/auth/password-field";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const loginInputClassName = authFieldClassName;

export function StudentLoginForm() {
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
      router.push(getRoleRedirect(user.role));
      toast.success(t("auth.loginSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-icvf-navy sm:text-3xl">{t("auth.welcomeBack")}</h1>
        <p className="mt-2 text-sm text-icvf-text-light sm:text-base">{t("auth.signInSub")}</p>
      </div>

      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        <span className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-icvf-navy shadow-sm">
          {t("auth.studentId")}
        </span>
      </div>

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
          href={`mailto:${BRAND.contact.email}?subject=Password%20reset%20request`}
          className="text-sm font-medium text-icvf-navy hover:text-icvf-accent hover:underline"
        >
          {t("auth.forgotPassword")}
        </a>
      </p>

      <p className="mt-8 text-center text-sm text-icvf-text-light">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-icvf-navy hover:text-icvf-accent hover:underline">
          {t("auth.createAccount")}
        </Link>
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
