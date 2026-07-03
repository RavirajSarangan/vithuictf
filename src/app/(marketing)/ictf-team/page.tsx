import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getIctfTeamMembers } from "@/lib/marketing-data";
import {
  MarketingContainer,
  MarketingSection,
  MarketingSectionIntro,
} from "@/components/landing/marketing-layout";
import TeamShowcase, { type TeamShowcaseMember } from "@/components/ui/team-showcase";
import type { IctfTeamMember } from "@/types";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "ICTF Team — Meet our instructors",
    description:
      "Meet the ICTF institute team — the instructors and staff behind our O/L and A/L ICT programs across Sri Lanka.",
    path: "/ictf-team",
    alternateLocales: ["en"],
  });
}

function toShowcaseMember(member: IctfTeamMember): TeamShowcaseMember {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    image: member.photoUrl,
    isLead: member.isLead,
    social: {
      facebook: member.facebookUrl || undefined,
      instagram: member.instagramUrl || undefined,
      linkedin: member.linkedinUrl || undefined,
      youtube: member.youtubeUrl || undefined,
      whatsapp: member.whatsapp || undefined,
      email: member.email || undefined,
    },
  };
}

export default async function IctfTeamPage() {
  const members = await getIctfTeamMembers();
  const showcaseMembers = [
    ...members.filter((m) => m.isLead),
    ...members.filter((m) => !m.isLead),
  ].map(toShowcaseMember);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "ICTF Team", path: "/ictf-team" },
        ]}
      />
      <MarketingSection tone="light">
        <MarketingSectionIntro
          as="h1"
          badge="ICTF Team"
          title="Meet the people behind"
          accent="our ICT programs"
          subtitle="The instructors and staff who guide O/L and A/L ICT students across the ICTF institute network."
          light={false}
          badgeVariant="accent"
        />

        <MarketingContainer>
          {members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-icvf-border bg-white px-6 py-16 text-center shadow-sm">
              <h2 className="text-xl font-bold text-icvf-navy">Team coming soon</h2>
              <p className="mt-2 text-icvf-text-light">
                Our team profiles will appear here shortly.
              </p>
            </div>
          ) : (
            <TeamShowcase members={showcaseMembers} />
          )}
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
