import { brandLogoSettingsToRootCss } from "@/lib/brand-logo-settings";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { BrandLogoCssSync } from "@/components/shared/brand-logo-css-sync";

/** Injects admin-managed nav/footer logo CSS variables on :root. */
export async function MarketingBrandVariables() {
  const settings = await getPlatformSettings();
  const css = brandLogoSettingsToRootCss(settings.brandLogo);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <BrandLogoCssSync initialSettings={settings.brandLogo} />
    </>
  );
}
