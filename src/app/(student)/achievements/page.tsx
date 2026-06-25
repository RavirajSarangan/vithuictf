"use client";

import { useEffect, useState } from "react";
import { useStudentData, useAchievements } from "@/hooks/use-data";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/shared/glass-card";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { cn } from "@/lib/utils";
import type { BadgeDefinition } from "@/types";
import { Flame, Trophy, Zap, Crown, Calendar, BookOpen } from "lucide-react";

const iconMap: Record<string, typeof Flame> = {
  flame: Flame,
  trophy: Trophy,
  zap: Zap,
  crown: Crown,
  calendar: Calendar,
  book: BookOpen,
};

export default function AchievementsPage() {
  const student = useStudentData();
  const { achievements: unlocked, isLoading: achievementsLoading } = useAchievements(student?.id);
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinition[] | null>(null);
  const unlockedIds = new Set(unlocked.map((a) => a.badgeId));

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("badge_definitions")
      .select("*")
      .then(({ data }) =>
        setBadgeDefinitions(
          (data ?? []).map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            icon: row.icon,
            points: row.points,
          }))
        )
      );
  }, []);

  if (student === undefined || badgeDefinitions === null || achievementsLoading) {
    return <StudentPageLoading rows={3} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Achievements"
        description="Earn badges by studying consistently and completing milestones."
      />

      <GlassCard className="bg-gradient-to-r from-icvf-navy to-icvf-navy-dark text-white">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div>
            <p className="text-sm text-white/70">Total points</p>
            <p className="text-3xl font-bold text-icvf-accent sm:text-4xl">{student?.points ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Study streak</p>
            <p className="text-3xl font-bold sm:text-4xl">{student?.streak ?? 0} days</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Badges earned</p>
            <p className="text-3xl font-bold sm:text-4xl">
              {unlocked.length}/{badgeDefinitions.length}
            </p>
          </div>
        </div>
      </GlassCard>

      {badgeDefinitions.length === 0 ? (
        <StudentEmptyState message="Badge definitions are not configured yet. Check back soon." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {badgeDefinitions.map((badge) => {
            const isUnlocked = unlockedIds.has(badge.id);
            const Icon = iconMap[badge.icon] ?? Trophy;
            return (
              <GlassCard
                key={badge.id}
                className={cn(
                  "transition-all",
                  isUnlocked ? "ring-2 ring-icvf-accent" : "opacity-60 grayscale"
                )}
              >
                <div
                  className={cn(
                    "mb-4 flex size-12 items-center justify-center rounded-2xl sm:size-14",
                    isUnlocked ? "bg-icvf-accent/15" : "bg-icvf-surface"
                  )}
                >
                  <Icon className={cn("size-6 sm:size-7", isUnlocked ? "text-icvf-accent" : "text-icvf-text-light")} />
                </div>
                <h3 className="font-semibold text-icvf-navy">{badge.title}</h3>
                <p className="mt-1 text-sm text-icvf-text-light">{badge.description}</p>
                <p className="mt-2 text-sm font-medium text-icvf-accent">+{badge.points} points</p>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
