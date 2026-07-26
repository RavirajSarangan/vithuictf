"use client";

import { MarketingSection, MarketingSectionIntro } from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { AcademicStaffCard } from "@/components/landing/academic-staff-card";
import { useAcademicStaff } from "@/hooks/use-data";

export function AcademicStaffSection() {
  const staff = useAcademicStaff();

  if (staff.length === 0) return null;

  return (
    <MarketingSection id="academic-staff" tone="surface">
      <MarketingSectionIntro
        badge="Our Educators"
        title="Meet Our Academic Staff"
        subtitle="Experienced teachers and subject specialists guiding every student toward island-first results."
        badgeVariant="accent"
        light={false}
      />

      <MotionStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" stagger={0.05}>
        {staff.map((member) => (
          <MotionStaggerItem key={member.id}>
            <AcademicStaffCard member={member} />
          </MotionStaggerItem>
        ))}
      </MotionStagger>
    </MarketingSection>
  );
}
