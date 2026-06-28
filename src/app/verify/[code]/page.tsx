import type { Metadata } from "next";
import Image from "next/image";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { CanvasSection, LightPremiumCard } from "@/components/canvas";
import { BRAND } from "@/lib/constants";
import { buildPortalPageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return buildPortalPageMetadata({
    title: `Certificate Verification | ${BRAND.name}`,
    description: `Verify an ICTF certificate using code ${code}. Official certificate lookup for ${BRAND.legalName}, Sri Lanka.`,
  });
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let cert: {
    student_name: string;
    course_name: string;
    issued_at: string;
    certificate_number: string | null;
    verify_code: string | null;
    image_path: string | null;
  } | null = null;

  let imageUrl: string | null = null;

  if (isAdminClientConfigured()) {
    const admin = createAdminClient();
    const { data: byNumber } = await admin
      .from("certificates")
      .select("student_name, course_name, issued_at, certificate_number, verify_code, image_path")
      .eq("certificate_number", code)
      .maybeSingle();

    if (byNumber) {
      cert = byNumber;
    } else {
      const { data: byVerify } = await admin
        .from("certificates")
        .select("student_name, course_name, issued_at, certificate_number, verify_code, image_path")
        .eq("verify_code", code)
        .maybeSingle();
      cert = byVerify;
    }

    if (cert?.image_path) {
      const { data: signed } = await admin.storage.from("certificates").createSignedUrl(cert.image_path, 3600);
      imageUrl = signed?.signedUrl ?? null;
    }
  }

  const displayId = cert?.certificate_number ?? cert?.verify_code ?? code;

  return (
    <div className="min-h-screen bg-icvf-surface px-4 py-24">
      <CanvasSection tone="light" className="py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-icvf-navy">Certificate Verification</h1>
          <p className="mt-2 text-sm text-icvf-text-light">{BRAND.legalName}</p>

          {cert ? (
            <LightPremiumCard className="mt-8 p-8 text-left">
              <p className="text-sm font-medium text-icvf-success">Valid certificate</p>
              <p className="mt-4 text-lg font-semibold text-icvf-navy">{cert.student_name}</p>
              <p className="text-icvf-text-light">{cert.course_name}</p>
              <p className="mt-2 text-sm text-icvf-text-light">
                Issued {new Date(cert.issued_at).toLocaleDateString()}
              </p>
              <p className="mt-4 font-mono text-xs text-icvf-text-light">Certificate ID: {displayId}</p>
              {imageUrl ? (
                <div className="relative mt-6 aspect-[1.414/1] overflow-hidden rounded-lg border">
                  <Image
                    src={imageUrl}
                    alt={`Certificate for ${cert.student_name}`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : null}
            </LightPremiumCard>
          ) : (
            <LightPremiumCard className="mt-8 p-8">
              <p className="font-medium text-icvf-danger">Certificate not found</p>
              <p className="mt-2 text-sm text-icvf-text-light">
                This verification code is invalid or has been revoked.
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
