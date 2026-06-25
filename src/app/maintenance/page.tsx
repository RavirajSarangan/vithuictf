import { redirect } from "next/navigation";
import { SiteStatusPage } from "@/components/shared/site-status-page";
import { parseSitePublicMode } from "@/lib/site-access";
import { createClient } from "@/lib/supabase/server";

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("site_public_mode")
    .eq("id", 1)
    .maybeSingle();

  const mode = parseSitePublicMode(data?.site_public_mode);

  if (mode === "live") {
    redirect("/");
  }
  if (mode === "coming_soon") {
    redirect("/coming-soon");
  }

  return <SiteStatusPage variant="maintenance" />;
}
