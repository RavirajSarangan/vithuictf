"use client";

import dynamic from "next/dynamic";
import { MarketingComingSoonShell } from "@/components/landing/marketing-coming-soon-shell";
import { useMarketingData } from "@/contexts/marketing-data-context";
import { Skeleton } from "@/components/ui/skeleton";

const sectionLoading = () => <Skeleton className="mx-auto mb-16 h-64 max-w-6xl rounded-2xl" />;

const ResultsShowcaseSection = dynamic(
  () => import("@/components/landing/results-showcase-section").then((m) => m.ResultsShowcaseSection),
  { loading: sectionLoading }
);
const IslandwidePresenceSection = dynamic(
  () => import("@/components/landing/islandwide-presence-section").then((m) => m.IslandwidePresenceSection),
  { loading: sectionLoading }
);
const ProgramsShowcaseSection = dynamic(
  () => import("@/components/landing/programs-showcase-section").then((m) => m.ProgramsShowcaseSection),
  { loading: sectionLoading }
);
const AboutInstituteSection = dynamic(
  () => import("@/components/landing/about-institute-section").then((m) => m.AboutInstituteSection),
  { loading: sectionLoading }
);
const AboutFounderSection = dynamic(
  () => import("@/components/landing/about-founder-section").then((m) => m.AboutFounderSection),
  { loading: sectionLoading }
);
const LmsPlatformSection = dynamic(
  () => import("@/components/landing/lms-platform-section").then((m) => m.LmsPlatformSection),
  { loading: sectionLoading }
);
const PaperCenterNetworkSection = dynamic(
  () => import("@/components/landing/paper-center-network-section").then((m) => m.PaperCenterNetworkSection),
  { loading: sectionLoading }
);
const SuccessStories = dynamic(
  () => import("@/components/landing/success-stories").then((m) => m.SuccessStories),
  { loading: sectionLoading }
);
const FaqSection = dynamic(
  () => import("@/components/landing/faq-section").then((m) => m.FaqSection),
  { loading: sectionLoading }
);
const StudentRegisterSection = dynamic(
  () => import("@/components/landing/student-register-section").then((m) => m.StudentRegisterSection),
  { loading: sectionLoading }
);
const ContactSection = dynamic(
  () => import("@/components/landing/contact-section").then((m) => m.ContactSection),
  { loading: sectionLoading }
);

export function MarketingHomeSections() {
  const data = useMarketingData();
  const comingSoon = data?.marketingComingSoonEnabled ?? true;

  if (comingSoon) {
    return <MarketingComingSoonShell />;
  }

  return (
    <>
      <ResultsShowcaseSection />
      <IslandwidePresenceSection />
      <ProgramsShowcaseSection />
      <AboutInstituteSection />
      <AboutFounderSection />
      <LmsPlatformSection />
      <PaperCenterNetworkSection />
      <SuccessStories />
      <FaqSection />
      <StudentRegisterSection />
      <ContactSection />
    </>
  );
}
