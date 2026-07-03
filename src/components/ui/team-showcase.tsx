"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamShowcaseMember {
  id: string;
  name: string;
  role: string;
  image: string;
  isLead?: boolean;
  social?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    whatsapp?: string;
    email?: string;
  };
}

// lucide-react no longer ships brand icons, so use inline Simple Icons glyphs.
function BrandGlyph({ path, size = 12 }: { path: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const BRAND_PATHS = {
  facebook:
    "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.582 0 11.94-5.359 11.944-11.893a11.821 11.821 0 0 0-3.48-8.464",
} as const;

type SocialLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function socialLinks(member: TeamShowcaseMember): SocialLink[] {
  const social = member.social;
  if (!social) return [];
  const links: SocialLink[] = [];
  if (social.facebook)
    links.push({ href: social.facebook, label: "Facebook", icon: <BrandGlyph path={BRAND_PATHS.facebook} /> });
  if (social.instagram)
    links.push({ href: social.instagram, label: "Instagram", icon: <BrandGlyph path={BRAND_PATHS.instagram} /> });
  if (social.linkedin)
    links.push({ href: social.linkedin, label: "LinkedIn", icon: <BrandGlyph path={BRAND_PATHS.linkedin} /> });
  if (social.youtube)
    links.push({ href: social.youtube, label: "YouTube", icon: <BrandGlyph path={BRAND_PATHS.youtube} /> });
  if (social.whatsapp)
    links.push({
      href: `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, "")}`,
      label: "WhatsApp",
      icon: <BrandGlyph path={BRAND_PATHS.whatsapp} />,
    });
  if (social.email)
    links.push({ href: `mailto:${social.email}`, label: "Email", icon: <Mail className="size-3" /> });
  return links;
}

interface TeamShowcaseProps {
  members: TeamShowcaseMember[];
}

export default function TeamShowcase({ members }: TeamShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const col1 = members.filter((_, i) => i % 3 === 0);
  const col2 = members.filter((_, i) => i % 3 === 1);
  const col3 = members.filter((_, i) => i % 3 === 2);

  return (
    <div className="mx-auto flex w-full max-w-5xl select-none flex-col items-start gap-8 px-4 py-8 font-sans md:flex-row md:gap-10 md:px-6 lg:gap-14">
      {/* Left: staggered photo grid */}
      <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 md:gap-3 md:pb-0">
        <div className="flex flex-col gap-2 md:gap-3">
          {col1.map((member) => (
            <PhotoCard
              key={member.id}
              member={member}
              className="h-[120px] w-[110px] sm:h-[140px] sm:w-[130px] md:h-[165px] md:w-[155px]"
              sizes="155px"
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 sm:mt-14 md:mt-17 md:gap-3">
          {col2.map((member) => (
            <PhotoCard
              key={member.id}
              member={member}
              className="h-[132px] w-[122px] sm:h-[155px] sm:w-[145px] md:h-[182px] md:w-[172px]"
              sizes="172px"
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}
        </div>
        <div className="mt-5.5 flex flex-col gap-2 sm:mt-6.5 md:mt-8 md:gap-3">
          {col3.map((member) => (
            <PhotoCard
              key={member.id}
              member={member}
              className="h-[125px] w-[115px] sm:h-[146px] sm:w-[136px] md:h-[172px] md:w-[162px]"
              sizes="162px"
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}
        </div>
      </div>

      {/* Right: member name list */}
      <div className="flex w-full flex-1 flex-col gap-4 pt-0 sm:grid sm:grid-cols-2 md:flex md:flex-col md:gap-5 md:pt-2">
        {members.map((member) => (
          <MemberRow key={member.id} member={member} hoveredId={hoveredId} onHover={setHoveredId} />
        ))}
      </div>
    </div>
  );
}

function PhotoCard({
  member,
  className,
  sizes,
  hoveredId,
  onHover,
}: {
  member: TeamShowcaseMember;
  className: string;
  sizes: string;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;

  return (
    <div
      className={cn(
        "relative shrink-0 cursor-pointer overflow-hidden rounded-xl bg-icvf-navy/5 transition-opacity duration-400",
        className,
        isDimmed ? "opacity-60" : "opacity-100"
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      {member.image ? (
        <Image
          src={member.image}
          alt={member.name}
          fill
          sizes={sizes}
          className="object-cover transition-[filter] duration-500"
          style={{
            filter: isActive ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(0.77)",
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-icvf-navy/30">
          <Users className="size-10" />
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  hoveredId,
  onHover,
}: {
  member: TeamShowcaseMember;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;
  const links = socialLinks(member);

  return (
    <div
      className={cn(
        "cursor-pointer transition-opacity duration-300",
        isDimmed ? "opacity-50" : "opacity-100"
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "h-3 shrink-0 rounded-[5px] transition-all duration-300",
            isActive ? "w-5 bg-icvf-accent" : "w-4 bg-icvf-navy/25"
          )}
        />
        <span
          className={cn(
            "text-base leading-none font-semibold tracking-tight transition-colors duration-300 md:text-lg",
            isActive ? "text-icvf-navy" : "text-icvf-navy/80"
          )}
        >
          {member.name}
        </span>
        {member.isLead && (
          <span className="rounded-full bg-icvf-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-icvf-accent">
            Team Lead
          </span>
        )}

        {links.length > 0 && (
          <div
            className={cn(
              "ml-0.5 flex items-center gap-1.5 transition-all duration-200",
              isActive
                ? "translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-2 opacity-0"
            )}
          >
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on ${link.label}`}
                title={link.label}
                onClick={(e) => e.stopPropagation()}
                className="rounded p-1 text-icvf-text-light transition-all duration-150 hover:scale-110 hover:bg-icvf-navy/10 hover:text-icvf-navy"
              >
                {link.icon}
              </a>
            ))}
          </div>
        )}
      </div>

      <p className="mt-1.5 pl-[27px] text-[9px] font-medium uppercase tracking-[0.2em] text-icvf-accent md:text-[10px]">
        {member.role}
      </p>
    </div>
  );
}
