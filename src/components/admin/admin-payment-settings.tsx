"use client";

import { useState } from "react";
import { updatePlatformPaymentSettings } from "@/lib/actions/payments-admin";
import { usePlatformSettings } from "@/hooks/use-data";
import {
  getOnlinePaymentsStatusLabel,
  isOnlinePaymentsAvailable,
  isStripeConfigured,
} from "@/lib/payment-access";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AdminPaymentSettingsPanel() {
  const { settings, loading, refresh } = usePlatformSettings();
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(settings.onlinePaymentsEnabled);
  const [instituteFee, setInstituteFee] = useState(settings.defaultInstituteFeeLkr);
  const [settingsKey, setSettingsKey] = useState(
    () => `${settings.onlinePaymentsEnabled}:${settings.defaultInstituteFeeLkr}`
  );

  const nextSettingsKey = `${settings.onlinePaymentsEnabled}:${settings.defaultInstituteFeeLkr}`;
  const dirty =
    enabled !== settings.onlinePaymentsEnabled || instituteFee !== settings.defaultInstituteFeeLkr;

  if (settingsKey !== nextSettingsKey && !dirty && !saving) {
    setSettingsKey(nextSettingsKey);
    setEnabled(settings.onlinePaymentsEnabled);
    setInstituteFee(settings.defaultInstituteFeeLkr);
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">Loading payment settings…</p>
      </GlassCard>
    );
  }

  const status = getOnlinePaymentsStatusLabel(settings);
  const stripeReady = isStripeConfigured();
  const live = isOnlinePaymentsAvailable(settings);

  const onSave = async () => {
    if (instituteFee < 1) {
      toast.error("Default institute fee must be at least LKR 1");
      return;
    }
    setSaving(true);
    try {
      await updatePlatformPaymentSettings({
        onlinePaymentsEnabled: enabled,
        defaultInstituteFeeLkr: instituteFee,
      });
      refresh();
      toast.success(enabled ? "Online payments enabled" : "Online payments set to coming soon");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setEnabled(settings.onlinePaymentsEnabled);
    setInstituteFee(settings.defaultInstituteFeeLkr);
  };

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-icvf-accent" />
            <h3 className="font-semibold">Online payments</h3>
            <Badge
              className={
                live
                  ? "bg-green-600"
                  : status === "misconfigured"
                    ? "bg-amber-600"
                    : "bg-muted text-foreground"
              }
            >
              {live ? "Live" : status === "misconfigured" ? "Needs Stripe keys" : "Coming soon"}
            </Badge>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Students see Pay with Stripe only when enabled here and Stripe keys are configured.
            Manual fee recording below always works for staff.
          </p>
        </div>
        <Badge variant="outline" className="border-input text-muted-foreground">
          Stripe: {stripeReady ? "configured" : "not configured"}
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border bg-black/20 p-4">
          <div>
            <Label>Enable online checkout</Label>
            <p className="text-xs text-muted-foreground">Off = students see coming soon</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default-institute-fee">
            Default institute fee (LKR)
          </Label>
          <Input
            id="default-institute-fee"
            type="number"
            min={1}
            value={instituteFee}
            onChange={(e) => setInstituteFee(Number(e.target.value) || 0)}
            className="border-input bg-background text-foreground"
          />
        </div>
      </div>

      {enabled && !stripeReady ? (
        <p className="mt-4 text-sm text-amber-300">
          Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable live checkout.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          
          disabled={saving || !dirty || instituteFee < 1}
          onClick={() => void onSave()}
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save payment settings
        </Button>
        {dirty ? (
          <Button variant="outline"  onClick={onReset}>
            Reset
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
