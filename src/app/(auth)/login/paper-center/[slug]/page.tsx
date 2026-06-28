import { notFound } from "next/navigation";
import { AuthLoginShell } from "@/components/auth/auth-login-shell";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PaperCenterSlugLoginPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: center } = await supabase
    .from("paper_centers")
    .select("name, slug, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!center?.is_active) {
    notFound();
  }

  return <AuthLoginShell variant="paperCenter" centerName={center.name} centerSlug={center.slug} />;
}
