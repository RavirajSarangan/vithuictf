"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateMarketingComingSoon, updateSitePublicMode } from "@/lib/actions/admin";
import { syncClientCachesAfterAdminSave } from "@/lib/client-cache-sync";
import { usePlatformSettings } from "@/hooks/use-data";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, ExternalLink, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import type { SitePublicMode } from "@/types";

const SITE_MODE_OPTIONS: {
  value: SitePublicMode;
  label: string;
  description: string;
}[] = [
  {
    value: "live",
    label: "Live",
    description: "Public site and portals operate normally.",
  },
  {
    value: "coming_soon",
    label: "Coming Soon",
    description: "Entire site is closed. Visitors see the coming soon page only.",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    description: "Site is closed during updates. Visitors see the maintenance page.",
  },
];

function siteModeBadgeLabel(mode: SitePublicMode): string {
  if (mode === "coming_soon") return "Coming Soon";
  if (mode === "maintenance") return "Maintenance";
  return "Live";
}

export function AdminMarketingVisibilityPanel() {
  const router = useRouter();
  const { settings, loading, refresh } = usePlatformSettings();
  const [saving, setSaving] = useState(false);
  const [siteMode, setSiteMode] = useState<SitePublicMode>(settings.sitePublicMode);
  const [homepageBlur, setHomepageBlur] = useState(settings.marketingComingSoonEnabled);
  const [settingsKey, setSettingsKey] = useState(
    () => `${settings.sitePublicMode}-${settings.marketingComingSoonEnabled}`
  );

  const nextSettingsKey = `${settings.sitePublicMode}-${settings.marketingComingSoonEnabled}`;
  const siteModeDirty = siteMode !== settings.sitePublicMode;
  const homepageBlurDirty = homepageBlur !== settings.marketingComingSoonEnabled;
  const dirty = siteModeDirty || homepageBlurDirty;
  const siteIsLive = settings.sitePublicMode === "live";
  const draftSiteIsLive = siteMode === "live";

  if (settingsKey !== nextSettingsKey && !dirty && !saving) {
    setSettingsKey(nextSettingsKey);
    setSiteMode(settings.sitePublicMode);
    setHomepageBlur(settings.marketingComingSoonEnabled);
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">Loading visibility settings…</p>
      </GlassCard>
    );
  }

  const onSave = async () => {
    setSaving(true);
    try {
      if (siteModeDirty) {
        await updateSitePublicMode(siteMode);
      }
      if (homepageBlurDirty) {
        await updateMarketingComingSoon(homepageBlur);
      }
      refresh();
      syncClientCachesAfterAdminSave();
      router.refresh();
      toast.success("Site visibility updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onEndMaintenance = async () => {
    setSaving(true);
    try {
      await updateSitePublicMode("live");
      setSiteMode("live");
      refresh();
      syncClientCachesAfterAdminSave();
      router.refresh();
      toast.success("Maintenance ended — site is live");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to end maintenance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Site status</h3>
            <p className="text-sm text-muted-foreground">
              Control whether the full website is public. Only admins can access the site while
              Coming Soon or Maintenance is active.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 border-input text-muted-foreground">
            {siteModeBadgeLabel(settings.sitePublicMode)}
          </Badge>
        </div>

        <RadioGroup
          value={siteMode}
          onValueChange={(value) => setSiteMode(value as SitePublicMode)}
          className="mt-6 space-y-3"
          disabled={saving}
        >
          {SITE_MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`site-mode-${option.value}`}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-black/20 px-4 py-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-icvf-accent/50"
            >
              <RadioGroupItem
                id={`site-mode-${option.value}`}
                value={option.value}
                className="mt-0.5 border-input text-icvf-accent"
              />
              <div className="space-y-0.5">
                <span className="font-medium text-foreground">{option.label}</span>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>

        <div className="mt-6 flex flex-wrap gap-3">
          {settings.sitePublicMode === "maintenance" && (
            <Button
              variant="outline"
              className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10"
              onClick={onEndMaintenance}
              disabled={saving}
            >
              <Wrench className="mr-2 size-4" />
              End maintenance
            </Button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
          <Link
            href="/coming-soon"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-icvf-accent hover:underline"
          >
            Preview coming soon
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
          <Link
            href="/maintenance"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-icvf-accent hover:underline"
          >
            Preview maintenance
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {homepageBlur ? (
                <EyeOff className="size-5 text-icvf-accent" aria-hidden />
              ) : (
                <Eye className="size-5 text-emerald-400" aria-hidden />
              )}
              <h3 className="text-lg font-semibold">Homepage visibility</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              When the site is live, blur sections below the hero with a Coming Soon panel. Hero and
              footer stay visible.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 border-input text-muted-foreground">
            {homepageBlur ? "Sections hidden" : "Full homepage"}
          </Badge>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-black/20 px-4 py-4">
          <div className="space-y-0.5">
            <Label htmlFor="marketing-coming-soon">
              Blur sections &amp; show Coming Soon
            </Label>
            <p className="text-xs text-muted-foreground">
              {draftSiteIsLive
                ? "Turn off when ready to publish all homepage content."
                : "Available only while the site is Live."}
            </p>
          </div>
          <Switch
            id="marketing-coming-soon"
            checked={homepageBlur}
            onCheckedChange={setHomepageBlur}
            disabled={saving || !draftSiteIsLive}
          />
        </div>

        {!siteIsLive && (
          <p className="mt-4 text-xs text-muted-foreground">
            Homepage blur is inactive while the site is in {siteModeBadgeLabel(settings.sitePublicMode)}{" "}
            mode.
          </p>
        )}
      </GlassCard>

      {dirty && (
        <Button
          className="w-fit"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save visibility settings"
          )}
        </Button>
      )}
    </div>
  );
}
