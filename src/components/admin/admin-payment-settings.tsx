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
  const [tuition, setTuition] = useState(settings.defaultTuitionLkr);
  const [settingsKey, setSettingsKey] = useState(
    () => `${settings.onlinePaymentsEnabled}:${settings.defaultTuitionLkr}`
  );

  const nextSettingsKey = `${settings.onlinePaymentsEnabled}:${settings.defaultTuitionLkr}`;
  const dirty =
    enabled !== settings.onlinePaymentsEnabled || tuition !== settings.defaultTuitionLkr;

  if (settingsKey !== nextSettingsKey && !dirty && !saving) {
    setSettingsKey(nextSettingsKey);
    setEnabled(settings.onlinePaymentsEnabled);
    setTuition(settings.defaultTuitionLkr);
  }

  if (loading) {
    return (
      <GlassCard className="border-white/10 bg-white/5 p-6 text-white">
        <p className="text-sm text-white/60">Loading payment settings…</p>
      </GlassCard>
    );
  }

  const status = getOnlinePaymentsStatusLabel(settings);
  const stripeReady = isStripeConfigured();
  const live = isOnlinePaymentsAvailable(settings);

  const onSave = async () => {
    if (tuition < 1) {
      toast.error("Default tuition fee must be at least LKR 1");
      return;
    }
    setSaving(true);
    try {
      await updatePlatformPaymentSettings({
        onlinePaymentsEnabled: enabled,
        defaultTuitionLkr: tuition,
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
    setTuition(settings.defaultTuitionLkr);
  };

  return (
    <GlassCard className="border-white/10 bg-white/5 p-6 text-white">
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
                    : "bg-white/15 text-white"
              }
            >
              {live ? "Live" : status === "misconfigured" ? "Needs Stripe keys" : "Coming soon"}
            </Badge>
          </div>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Students see Pay with Stripe only when enabled here and Stripe keys are configured.
            Manual fee recording below always works for staff.
          </p>
        </div>
        <Badge variant="outline" className="border-white/20 text-white/80">
          Stripe: {stripeReady ? "configured" : "not configured"}
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4">
          <div>
            <Label className="text-white">Enable online checkout</Label>
            <p className="text-xs text-white/50">Off = students see coming soon</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default-institute-fee" className="text-white">
            Default tuition fee (LKR)
          </Label>
          <Input
            id="default-institute-fee"
            type="number"
            min={1}
            value={tuition}
            onChange={(e) => setTuition(Number(e.target.value) || 0)}
            className="border-white/15 bg-black/20 text-white"
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
          className="bg-icvf-accent hover:bg-icvf-accent-hover"
          disabled={saving || !dirty || tuition < 1}
          onClick={() => void onSave()}
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save payment settings
        </Button>
        {dirty ? (
          <Button variant="outline" className="border-white/20 text-white" onClick={onReset}>
            Reset
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
