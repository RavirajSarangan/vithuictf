import { redirect } from "next/navigation";
import { getBlockedMarketingRedirect } from "@/lib/marketing-page-access";

export default function PublicRankingsPage() {
  redirect(getBlockedMarketingRedirect("/rankings") ?? "/");
}
