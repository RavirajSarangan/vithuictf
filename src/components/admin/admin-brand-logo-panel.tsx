"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBrandLogoSettings } from "@/lib/actions/admin";
import { syncClientCachesAfterAdminSave } from "@/lib/client-cache-sync";
import {
  brandLogoSettingsToCssProperties,
  DEFAULT_BRAND_LOGO_SETTINGS,
} from "@/lib/brand-logo-settings";
import { NavBrand } from "@/components/landing/nav-brand";
import { BrandLogo } from "@/components/shared/brand-logo";
import { usePlatformSettings } from "@/hooks/use-data";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { BrandLogoSettings } from "@/types";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type SliderFieldProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
};

function SliderField({ id, label, value, min, max, step, unit = "", onChange }: SliderFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm text-muted-foreground">
          {label}
        </Label>
        <span className="text-sm font-medium tabular-nums text-foreground">
          {value.toFixed(step < 1 ? 2 : 1)}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-icvf-accent"
      />
    </div>
  );
}

function BrandLogoPreview({ settings }: { settings: BrandLogoSettings }) {
  const cssVars = brandLogoSettingsToCssProperties(settings);

  return (
    <div className="space-y-4 rounded-2xl border  p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live preview</p>

      <div style={cssVars} className="space-y-4">
        <div className="flex items-center justify-center rounded-full border border-border bg-black px-4 py-2.5">
          <NavBrand />
        </div>

        <div className="rounded-xl bg-gradient-to-b from-icvf-navy via-icvf-navy to-icvf-navy-dark p-4">
          <div className="marketing-footer-brand flex flex-col items-start">
            <BrandLogo size="footer" light />
            <p className="mt-2 text-xs text-muted-foreground">ICTF — ICT Foundation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function settingsKey(settings: BrandLogoSettings): string {
  return JSON.stringify(settings);
}

export function AdminBrandLogoPanel() {
  const router = useRouter();
  const { settings, loading, refresh } = usePlatformSettings();
  const [draft, setDraft] = useState<BrandLogoSettings>(settings.brandLogo);
  const [saving, setSaving] = useState(false);
  const [syncKey, setSyncKey] = useState(() => settingsKey(settings.brandLogo));

  const nextSyncKey = settingsKey(settings.brandLogo);
  const dirty = settingsKey(draft) !== nextSyncKey;

  if (syncKey !== nextSyncKey && !dirty && !saving) {
    setSyncKey(nextSyncKey);
    setDraft(settings.brandLogo);
  }

  const updateNav = (patch: Partial<BrandLogoSettings["nav"]>) => {
    setDraft((current) => ({ ...current, nav: { ...current.nav, ...patch } }));
  };

  const updateFooter = (patch: Partial<BrandLogoSettings["footer"]>) => {
    setDraft((current) => ({ ...current, footer: { ...current.footer, ...patch } }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await updateBrandLogoSettings(draft);
      refresh();
      syncClientCachesAfterAdminSave();
      router.refresh();
      toast.success("Brand logo sizes updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setDraft(DEFAULT_BRAND_LOGO_SETTINGS);
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">Loading brand settings…</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-icvf-navy">Header logo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Navbar pill height stays fixed. Adjust width and scale only.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SliderField
              id="nav-width"
              label="Logo width"
              value={draft.nav.widthRem}
              min={8}
              max={16}
              step={0.25}
              unit="rem"
              onChange={(value) => updateNav({ widthRem: value })}
            />
            <SliderField
              id="nav-scale"
              label="Scale (mobile)"
              value={draft.nav.scale}
              min={1}
              max={1.5}
              step={0.01}
              onChange={(value) => updateNav({ scale: value })}
            />
            <SliderField
              id="nav-scale-sm"
              label="Scale (desktop)"
              value={draft.nav.scaleSm}
              min={1}
              max={1.5}
              step={0.01}
              onChange={(value) => updateNav({ scaleSm: value })}
            />
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-icvf-navy">Footer logo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Footer alignment stays left-aligned.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SliderField
              id="footer-width"
              label="Width (mobile)"
              value={draft.footer.widthRem}
              min={9}
              max={22}
              step={0.25}
              unit="rem"
              onChange={(value) => updateFooter({ widthRem: value })}
            />
            <SliderField
              id="footer-height"
              label="Height (mobile)"
              value={draft.footer.heightRem}
              min={2.75}
              max={7}
              step={0.25}
              unit="rem"
              onChange={(value) => updateFooter({ heightRem: value })}
            />
            <SliderField
              id="footer-width-sm"
              label="Width (desktop)"
              value={draft.footer.widthRemSm}
              min={9}
              max={24}
              step={0.25}
              unit="rem"
              onChange={(value) => updateFooter({ widthRemSm: value })}
            />
            <SliderField
              id="footer-height-sm"
              label="Height (desktop)"
              value={draft.footer.heightRemSm}
              min={2.75}
              max={7.5}
              step={0.25}
              unit="rem"
              onChange={(value) => updateFooter({ heightRemSm: value })}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              
              disabled={!dirty || saving}
              onClick={onSave}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save brand sizes
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onReset}
            >
              <RotateCcw className="size-4" />
              Reset to defaults
            </Button>
          </div>
        </div>

        <BrandLogoPreview settings={draft} />
      </div>
    </GlassCard>
  );
}
