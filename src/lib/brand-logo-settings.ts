import type { CSSProperties } from "react";
import { z } from "zod";
import type { BrandLogoSettings } from "@/types";

export const DEFAULT_BRAND_LOGO_SETTINGS: BrandLogoSettings = {
  nav: { widthRem: 10.5, scale: 1.45, scaleSm: 1.52 },
  footer: { widthRem: 14, heightRem: 4, widthRemSm: 15, heightRemSm: 4.5 },
};

const brandLogoSettingsSchema = z.object({
  nav: z.object({
    widthRem: z.number().min(7).max(16),
    scale: z.number().min(1).max(1.6),
    scaleSm: z.number().min(1).max(1.6),
  }),
  footer: z.object({
    widthRem: z.number().min(9).max(22),
    heightRem: z.number().min(2.75).max(7),
    widthRemSm: z.number().min(9).max(24),
    heightRemSm: z.number().min(2.75).max(7.5),
  }),
});

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Merge partial/unknown DB JSON with defaults and clamp to allowed ranges. */
export function parseBrandLogoSettings(raw: unknown): BrandLogoSettings {
  const merged = {
    nav: {
      ...DEFAULT_BRAND_LOGO_SETTINGS.nav,
      ...(typeof raw === "object" && raw !== null && "nav" in raw
        ? (raw as { nav?: Partial<BrandLogoSettings["nav"]> }).nav
        : {}),
    },
    footer: {
      ...DEFAULT_BRAND_LOGO_SETTINGS.footer,
      ...(typeof raw === "object" && raw !== null && "footer" in raw
        ? (raw as { footer?: Partial<BrandLogoSettings["footer"]> }).footer
        : {}),
    },
  };

  const parsed = brandLogoSettingsSchema.safeParse(merged);
  if (parsed.success) {
    return applyBrandLogoVisibilityFloor(parsed.data);
  }

  return applyBrandLogoVisibilityFloor(merged as BrandLogoSettings);
}

export function clampBrandLogoSettings(settings: BrandLogoSettings): BrandLogoSettings {
  return {
    nav: {
      widthRem: clampNumber(settings.nav.widthRem, 7, 16),
      scale: clampNumber(settings.nav.scale, 1, 1.6),
      scaleSm: clampNumber(settings.nav.scaleSm, 1, 1.6),
    },
    footer: {
      widthRem: clampNumber(settings.footer.widthRem, 9, 22),
      heightRem: clampNumber(settings.footer.heightRem, 2.75, 7),
      widthRemSm: clampNumber(settings.footer.widthRemSm, 9, 24),
      heightRemSm: clampNumber(settings.footer.heightRemSm, 2.75, 7.5),
    },
  };
}

export function validateBrandLogoSettings(settings: BrandLogoSettings): BrandLogoSettings {
  const parsed = brandLogoSettingsSchema.safeParse(settings);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid brand logo settings");
  }
  return parsed.data;
}

export function applyBrandLogoVisibilityFloor(settings: BrandLogoSettings): BrandLogoSettings {
  const d = DEFAULT_BRAND_LOGO_SETTINGS;
  const s = clampBrandLogoSettings(settings);
  return {
    nav: {
      widthRem: Math.max(s.nav.widthRem, d.nav.widthRem),
      scale: Math.max(s.nav.scale, d.nav.scale),
      scaleSm: Math.max(s.nav.scaleSm, d.nav.scaleSm),
    },
    footer: {
      widthRem: clampNumber(s.footer.widthRem, 9, 22),
      heightRem: clampNumber(s.footer.heightRem, 2.75, 7),
      widthRemSm: clampNumber(s.footer.widthRemSm, 9, 24),
      heightRemSm: clampNumber(s.footer.heightRemSm, 2.75, 7.5),
    },
  };
}

export function brandLogoSettingsToCssProperties(
  settings: BrandLogoSettings
): CSSProperties & Record<string, string> {
  const s = applyBrandLogoVisibilityFloor(settings);
  return {
    "--brand-nav-logo-width": `${s.nav.widthRem}rem`,
    "--brand-nav-logo-scale": String(s.nav.scale),
    "--brand-nav-logo-scale-sm": String(s.nav.scaleSm),
    "--brand-footer-logo-width": `${s.footer.widthRem}rem`,
    "--brand-footer-logo-height": `${s.footer.heightRem}rem`,
    "--brand-footer-logo-width-sm": `${s.footer.widthRemSm}rem`,
    "--brand-footer-logo-height-sm": `${s.footer.heightRemSm}rem`,
  };
}

export function brandLogoSettingsToRootCss(settings: BrandLogoSettings): string {
  const vars = brandLogoSettingsToCssProperties(settings);
  const declarations = Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n  ");
  return `:root {\n  ${declarations}\n}`;
}

export function applyBrandLogoCssVariablesToRoot(settings: BrandLogoSettings): void {
  if (typeof document === "undefined") return;
  const vars = brandLogoSettingsToCssProperties(settings);
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
  }
}
