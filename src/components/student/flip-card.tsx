"use client";

import { useState } from "react";
import Image from "next/image";
import { RiGithubFill, RiLinkedinFill, RiTwitterXFill, RiWhatsappFill } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { hasAssignedRank } from "@/lib/student-rank";
import type { FlipCardData } from "@/types";

interface FlipCardProps {
  data: FlipCardData;
  className?: string;
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-icvf-accent"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  );
}

export function FlipCard({ data, className }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const showRank = hasAssignedRank(data.stats.rank);
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      aria-label={flipped ? "Show front of card" : "Show back of card"}
      onClick={() => setFlipped((f) => !f)}
      className={cn("group perspective-[1200px] w-full max-w-sm cursor-pointer border-0 bg-transparent p-0 text-left", className)}
    >
      <div
        className={cn(
          "relative h-[420px] w-full transition-transform duration-700 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/20 bg-gradient-to-br from-icvf-navy to-icvf-navy-dark p-8 shadow-xl [backface-visibility:hidden]">
          <div className="relative size-28 overflow-hidden rounded-full border-4 border-icvf-accent shadow-lg">
            {data.image ? (
              <Image src={data.image} alt={data.name} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="flex size-full items-center justify-center bg-icvf-accent/30 text-3xl font-bold text-white">
                {initials}
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">{data.name}</h3>
            <p className="mt-1 text-sm text-white/70">@{data.username}</p>
          </div>
          {data.courseName && (
            <span className="rounded-full bg-icvf-accent/20 px-4 py-1 text-sm font-medium text-icvf-accent">
              {data.courseName}
            </span>
          )}
          <p className="mt-auto text-xs text-white/50">Tap to flip</p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col rounded-2xl border border-white/20 bg-gradient-to-br from-icvf-navy-dark to-icvf-navy p-6 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <h4 className="mb-2 text-lg font-semibold text-white">About</h4>
          <p className="mb-4 flex-1 text-sm leading-relaxed text-white/80">
            {data.bio || "No bio yet."}
          </p>

          <div className={cn("mb-4 grid gap-2 text-center", showRank ? "grid-cols-3" : "grid-cols-2")}>
            <div className="rounded-xl bg-white/10 p-2">
              <p className="text-lg font-bold text-icvf-accent">{data.stats.points}</p>
              <p className="text-xs text-white/60">Points</p>
            </div>
            {showRank ? (
              <div className="rounded-xl bg-white/10 p-2">
                <p className="text-lg font-bold text-icvf-accent">#{data.stats.rank}</p>
                <p className="text-xs text-white/60">Rank</p>
              </div>
            ) : null}
            <div className="rounded-xl bg-white/10 p-2">
              <p className="text-lg font-bold text-icvf-accent">{data.stats.streak}</p>
              <p className="text-xs text-white/60">Streak</p>
            </div>
          </div>

          {(data.socialLinks?.linkedin ||
            data.socialLinks?.github ||
            data.socialLinks?.twitter ||
            data.socialLinks?.whatsapp) && (
            <div className="flex justify-center gap-2">
              {data.socialLinks.linkedin && (
                <SocialIcon href={data.socialLinks.linkedin} label="LinkedIn">
                  <RiLinkedinFill className="size-4" />
                </SocialIcon>
              )}
              {data.socialLinks.github && (
                <SocialIcon href={data.socialLinks.github} label="GitHub">
                  <RiGithubFill className="size-4" />
                </SocialIcon>
              )}
              {data.socialLinks.twitter && (
                <SocialIcon href={data.socialLinks.twitter} label="Twitter">
                  <RiTwitterXFill className="size-4" />
                </SocialIcon>
              )}
              {data.socialLinks.whatsapp && (
                <SocialIcon href={data.socialLinks.whatsapp} label="WhatsApp">
                  <RiWhatsappFill className="size-4" />
                </SocialIcon>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function studentToFlipCardData(student: {
  displayName: string;
  studentId: string;
  username?: string;
  photoURL?: string;
  courseName: string;
  bio?: string;
  points: number;
  rank: number;
  streak: number;
  socialLinks?: FlipCardData["socialLinks"];
}): FlipCardData {
  return {
    name: student.displayName,
    username: student.username ?? student.studentId,
    image: student.photoURL,
    courseName: student.courseName,
    bio: student.bio ?? "",
    stats: {
      points: student.points,
      rank: student.rank,
      streak: student.streak,
    },
    socialLinks: student.socialLinks,
  };
}
