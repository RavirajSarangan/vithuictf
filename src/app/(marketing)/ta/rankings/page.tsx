import { redirect } from "next/navigation";
import { getBlockedMarketingRedirect } from "@/lib/marketing-page-access";

export default function TamilRankingsPage() {
  redirect(getBlockedMarketingRedirect("/ta/rankings") ?? "/ta");
}
