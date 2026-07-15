import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CanvasSection, LightPremiumCard } from "@/components/canvas";
import { BRAND } from "@/lib/constants";
import { buildPortalPageMetadata } from "@/lib/seo/metadata";
import { ClaimCertificateForm } from "@/components/certificate-claims/claim-certificate-form";

export async function generateMetadata(): Promise<Metadata> {
  return buildPortalPageMetadata({
    title: `Claim Your Certificate | ${BRAND.name}`,
    description: `Claim your certificate of completion from ${BRAND.legalName}.`,
  });
}

export default async function ClaimCertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: claimLink } = await supabase
    .from("certificate_claim_links")
    .select("slug, course_name, status")
    .eq("slug", slug)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-icvf-surface px-4 py-24">
      <CanvasSection tone="light" className="py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-icvf-navy">Claim Your Certificate</h1>
          <p className="mt-2 text-sm text-icvf-text-light">{BRAND.legalName}</p>

          {claimLink && claimLink.status === "active" ? (
            <LightPremiumCard className="mt-8 p-8 text-left">
              <p className="text-sm font-medium text-icvf-text-light">Course</p>
              <p className="text-lg font-semibold text-icvf-navy">{claimLink.course_name}</p>
              <div className="mt-6">
                <ClaimCertificateForm slug={slug} />
              </div>
            </LightPremiumCard>
          ) : (
            <LightPremiumCard className="mt-8 p-8">
              <p className="font-medium text-icvf-danger">This certificate link is no longer active</p>
              <p className="mt-2 text-sm text-icvf-text-light">
                Please contact your instructor for a new link.
              </p>
            </LightPremiumCard>
          )}

          <Link href="/" className="mt-8 inline-block text-sm font-medium text-icvf-accent hover:underline">
            Back to homepage
          </Link>
        </div>
      </CanvasSection>
    </div>
  );
}
