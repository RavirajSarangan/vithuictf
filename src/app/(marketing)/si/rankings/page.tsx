import { redirect } from "next/navigation";
import { getBlockedMarketingRedirect } from "@/lib/marketing-page-access";

export default function SinhalaRankingsPage() {
  redirect(getBlockedMarketingRedirect("/si/rankings") ?? "/si");
}
