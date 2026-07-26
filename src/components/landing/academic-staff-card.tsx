"use client";

import Image from "next/image";
import { GraduationCap } from "lucide-react";
import type { AcademicStaffMember } from "@/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AcademicStaffCard({ member }: { member: AcademicStaffMember }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-icvf-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-icvf-accent/30 hover:shadow-xl">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-icvf-navy/10 to-icvf-accent/20">
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={member.name}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-bold text-icvf-navy/25">{initials(member.name)}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div>
          <p className="text-base font-bold leading-tight text-icvf-navy">{member.name}</p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-icvf-accent">
            {member.role}
          </p>
        </div>

        {member.affiliate ? (
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-icvf-border bg-icvf-surface px-3 py-1 text-[11px] font-medium text-icvf-text-light">
            <GraduationCap className="size-3.5 text-icvf-accent" aria-hidden />
            {member.affiliate}
          </span>
        ) : null}

        {member.bio ? (
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-icvf-text-light">{member.bio}</p>
        ) : null}
      </div>
    </div>
  );
}
