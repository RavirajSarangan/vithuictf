import { ComingSoon } from "@/components/shared/coming-soon";
import { createClient } from "@/lib/supabase/server";
import { isOnlinePaymentsAvailable } from "@/lib/payment-access.server";
import { redirect } from "next/navigation";

export default async function PaymentsComingSoonPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("online_payments_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (isOnlinePaymentsAvailable({ onlinePaymentsEnabled: settings?.online_payments_enabled ?? false })) {
    redirect("/settings");
  }

  return (
    <ComingSoon
      portalName="Online Payments — Coming Soon"
      description="Pay institute fees securely from your student portal with card checkout. Until then, contact ICTF or use bank/cash payment."
      helperText="Fee records are still managed by admin. You will be notified when online checkout goes live."
    />
  );
}
