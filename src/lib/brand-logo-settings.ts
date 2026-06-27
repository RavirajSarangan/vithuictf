import type { CSSProperties } from "react";
import { z } from "zod";
import type { BrandLogoSettings } from "@/types";

export const DEFAULT_BRAND_LOGO_SETTINGS: BrandLogoSettings = {
  nav: {
    widthRem: 6.25,
    heightRem: 2.5,
    widthRemSm: 7.5,
    heightRemSm: 3,
    scale: 1.08,
    scaleSm: 1.12,
  },
  footer: { widthRem: 6.75, heightRem: 2.875, widthRemSm: 5.875, heightRemSm: 2.5 },
};

const brandLogoSettingsSchema = z.object({
  nav: z.object({
    widthRem: z.number().min(3.5).max(18),
    heightRem: z.number().min(1.5).max(5),
    widthRemSm: z.number().min(3.5).max(20),
    heightRemSm: z.number().min(1.5).max(6),
    scale: z.number().min(1).max(1.8),
    scaleSm: z.number().min(1).max(1.8),
  }),
  footer: z.object({
    widthRem: z.number().min(9).max(26),
    heightRem: z.number().min(2.75).max(9),
    widthRemSm: z.number().min(9).max(28),
    heightRemSm: z.number().min(2.75).max(9.5),
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
      widthRem: clampNumber(settings.nav.widthRem, 3.5, 18),
      heightRem: clampNumber(settings.nav.heightRem, 1.5, 5),
      widthRemSm: clampNumber(settings.nav.widthRemSm, 3.5, 20),
      heightRemSm: clampNumber(settings.nav.heightRemSm, 1.5, 6),
      scale: clampNumber(settings.nav.scale, 1, 1.8),
      scaleSm: clampNumber(settings.nav.scaleSm, 1, 1.8),
    },
    footer: {
      widthRem: clampNumber(settings.footer.widthRem, 9, 26),
      heightRem: clampNumber(settings.footer.heightRem, 2.75, 9),
      widthRemSm: clampNumber(settings.footer.widthRemSm, 9, 28),
      heightRemSm: clampNumber(settings.footer.heightRemSm, 2.75, 9.5),
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
  const s = clampBrandLogoSettings(settings);
  const navFloor = DEFAULT_BRAND_LOGO_SETTINGS.nav;
  return {
    nav: {
      widthRem: Math.max(s.nav.widthRem, navFloor.widthRem),
      heightRem: Math.max(s.nav.heightRem, navFloor.heightRem),
      widthRemSm: Math.max(s.nav.widthRemSm, navFloor.widthRemSm),
      heightRemSm: Math.max(s.nav.heightRemSm, navFloor.heightRemSm),
      scale: Math.max(s.nav.scale, navFloor.scale),
      scaleSm: Math.max(s.nav.scaleSm, navFloor.scaleSm),
    },
    footer: {
      widthRem: s.footer.widthRem,
      heightRem: s.footer.heightRem,
      widthRemSm: s.footer.widthRemSm,
      heightRemSm: s.footer.heightRemSm,
    },
  };
}

export function brandLogoSettingsToCssProperties(
  settings: BrandLogoSettings
): CSSProperties & Record<string, string> {
  const s = applyBrandLogoVisibilityFloor(settings);
  return {
    "--brand-nav-logo-width": `${s.nav.widthRem}rem`,
    "--brand-nav-logo-height": `${s.nav.heightRem}rem`,
    "--brand-nav-logo-width-sm": `${s.nav.widthRemSm}rem`,
    "--brand-nav-logo-height-sm": `${s.nav.heightRemSm}rem`,
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
