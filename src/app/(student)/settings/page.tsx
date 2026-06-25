"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useStudentData, usePlatformSettings } from "@/hooks/use-data";
import { isOnlinePaymentsAvailable } from "@/lib/payment-access";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ONBOARDING_TOUR_KEY } from "@/components/onboarding/onboarding-gate";
import { useStudentOnboarding } from "@/hooks/use-student-onboarding";
import { updateStudentPassword } from "@/lib/actions/onboarding";
import { GlassCard } from "@/components/shared/glass-card";
import {
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { ButtonLink } from "@/components/shared/button-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createStripeCheckoutSession } from "@/lib/actions/stripe";
import { BRAND } from "@/lib/constants";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const student = useStudentData();
  const { settings: platformSettings, loading: platformSettingsLoading } = usePlatformSettings();
  const { resetForReplay } = useStudentOnboarding();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordSave = async () => {
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await updateStudentPassword(password);
      setPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleReplayOnboarding = async () => {
    sessionStorage.removeItem(ONBOARDING_TOUR_KEY);
    await resetForReplay();
    toast.success("Onboarding tour restarted");
    router.push("/onboarding");
  };

  const [paying, setPaying] = useState(false);

  const onlinePaymentsLive =
    !platformSettingsLoading &&
    isOnlinePaymentsAvailable({ onlinePaymentsEnabled: platformSettings.onlinePaymentsEnabled });

  const handlePayFees = async () => {
    if (!student) return;
    setPaying(true);
    try {
      const { url } = await createStripeCheckoutSession({
        studentId: student.id,
        studentName: student.displayName,
        description: `${BRAND.name} monthly institute fee`,
      });
      if (url) window.location.href = url;
      else toast.error("Payment could not be started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment unavailable");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Settings"
        description="Manage your profile, password, payments, and portal preferences."
      />

      {student === undefined ? (
        <StudentPageLoading rows={2} />
      ) : (
        <>
      <GlassCard>
        <h3 className="mb-6 font-semibold text-icvf-navy">Profile settings</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Full Name</Label>
            <Input defaultValue={user?.displayName} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <Input defaultValue={user?.email} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Student ID</Label>
            <Input defaultValue={student?.studentId} disabled />
          </div>
          <Button variant="icvf" onClick={() => toast.success("Profile updated")}>Save Changes</Button>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-6 font-semibold text-icvf-navy">Security</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-password">New password</Label>
            <Input
              id="settings-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-confirm">Confirm password</Label>
            <Input
              id="settings-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button variant="icvf" onClick={() => void handlePasswordSave()} disabled={savingPassword}>
            {savingPassword ? "Saving…" : "Update Password"}
          </Button>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-icvf-navy">Institute fee payment</h3>
          <Badge
            variant="outline"
            className={
              onlinePaymentsLive
                ? "border-icvf-accent/40 bg-icvf-accent/10 text-icvf-navy"
                : "border-icvf-border text-icvf-text-light"
            }
          >
            {onlinePaymentsLive ? "Online checkout live" : "Coming soon"}
          </Badge>
        </div>
        {platformSettingsLoading ? (
          <p className="mb-4 text-sm text-muted-foreground">Loading payment options…</p>
        ) : onlinePaymentsLive ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Pay monthly institute fees securely online via Stripe (LKR{" "}
              {platformSettings.defaultTuitionLkr.toLocaleString()} default).
            </p>
            <Button variant="icvf" onClick={() => void handlePayFees()} disabled={paying || !student}>
              {paying ? "Redirecting…" : "Pay with Stripe"}
            </Button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Online card payments are not open yet. Pay fees in person, by bank transfer, or contact the
              academy office. Your payment history is managed by admin.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/coming-soon/payments" variant="outline" className="gap-2">
                <Clock className="size-4" />
                Online payments — coming soon
              </ButtonLink>
              <ButtonLink href="/#contact" variant="icvf-outline-navy">
                Contact academy
              </ButtonLink>
            </div>
          </>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="mb-2 font-semibold text-icvf-navy">Help & tour</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Replay the student onboarding walkthrough to revisit your program and portal areas.
        </p>
        <Button variant="outline" onClick={() => void handleReplayOnboarding()}>
          Replay onboarding tour
        </Button>
        <ButtonLink href="/#programs" variant="link" className="mt-2 h-auto p-0">
          Browse {BRAND.name} programs on the website
        </ButtonLink>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-6 font-semibold text-icvf-navy">Notifications</h3>
        <div className="flex flex-col gap-4">
          {["Exam Results", "New Resources", "Achievements", "Announcements"].map((n) => (
            <div key={n} className="flex items-center justify-between">
              <Label>{n}</Label>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </GlassCard>
        </>
      )}
    </div>
  );
}
