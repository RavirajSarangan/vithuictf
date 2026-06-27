import { brandLogoSettingsToRootCss, DEFAULT_BRAND_LOGO_SETTINGS } from "@/lib/brand-logo-settings";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { BrandLogoCssSync } from "@/components/shared/brand-logo-css-sync";

/** Injects admin-managed nav/footer logo CSS variables on :root. */
export async function MarketingBrandVariables() {
  let brandLogo = DEFAULT_BRAND_LOGO_SETTINGS;

  try {
    const settings = await getPlatformSettings();
    brandLogo = settings.brandLogo;
  } catch {
    // Fall back to defaults when settings cannot be loaded during SSR.
  }

  const css = brandLogoSettingsToRootCss(brandLogo);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <BrandLogoCssSync initialSettings={brandLogo} />
    </>
  );
}
