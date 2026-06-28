"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SocialBrandIcon } from "@/components/social-tracking/social-brand-icon";
import { DAY_LABELS } from "@/lib/social-tracking-utils";
import type { SocialContentEntry, SocialContentType } from "@/types";
import { cn } from "@/lib/utils";

interface ContentChecklistGridProps {
  contentTypes: SocialContentType[];
  entries: SocialContentEntry[];
  onUpdateCount: (contentTypeId: string, dayOfWeek: number, postCount: number) => void;
  showAudit?: boolean;
}

function getPostCount(
  entries: SocialContentEntry[],
  contentTypeId: string,
  day: number
): number {
  const entry = entries.find(
    (e) => e.contentTypeId === contentTypeId && e.dayOfWeek === day
  );
  if (!entry) return 0;
  return entry.postCount ?? (entry.posted ? 1 : 0);
}

function UploadDayCell({
  contentTypeId,
  contentTypeName,
  day,
  initialCount,
  onUpdateCount,
  showAudit,
  updatedBy,
}: {
  contentTypeId: string;
  contentTypeName: string;
  day: number;
  initialCount: number;
  onUpdateCount: ContentChecklistGridProps["onUpdateCount"];
  showAudit?: boolean;
  updatedBy?: string;
}) {
  const done = initialCount > 0;
  const [checked, setChecked] = useState(done);
  const [value, setValue] = useState(String(initialCount || 1));

  useEffect(() => {
    setChecked(initialCount > 0);
    setValue(String(initialCount > 0 ? initialCount : 1));
  }, [initialCount]);

  const saveCount = (nextCount: number) => {
    const parsed = Math.max(0, Math.min(99, nextCount));
    if (parsed !== initialCount) {
      onUpdateCount(contentTypeId, day, parsed);
    }
  };

  const handleCheckChange = (nextChecked: boolean) => {
    setChecked(nextChecked);
    if (nextChecked) {
      const count = Math.max(1, parseInt(value, 10) || 1);
      setValue(String(count));
      saveCount(count);
    } else {
      setValue("1");
      saveCount(0);
    }
  };

  const commitCount = () => {
    if (!checked) return;
    const parsed = Math.max(1, Math.min(99, parseInt(value, 10) || 1));
    setValue(String(parsed));
    saveCount(parsed);
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-center gap-1.5">
        <Checkbox
          checked={checked}
          onCheckedChange={(state) => handleCheckChange(state === true)}
          aria-label={`${contentTypeName} uploaded on ${DAY_LABELS[day]}`}
          className={cn(checked && "border-emerald-600 data-[state=checked]:bg-emerald-600")}
        />
        <Input
          type="number"
          min={1}
          max={99}
          inputMode="numeric"
          disabled={!checked}
          className={cn(
            "h-8 w-11 px-1 text-center tabular-nums",
            !checked && "opacity-40"
          )}
          value={checked ? value : "0"}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commitCount}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label={`${contentTypeName} upload count on ${DAY_LABELS[day]}`}
        />
      </div>
      {checked ? (
        <span className="text-[10px] font-medium text-emerald-700">Done</span>
      ) : (
        <span className="text-[10px] text-icvf-text-light">—</span>
      )}
      {showAudit && updatedBy ? (
        <span className="text-[10px] text-icvf-text-light">logged</span>
      ) : null}
    </div>
  );
}

export function ContentChecklistGrid({
  contentTypes,
  entries,
  onUpdateCount,
  showAudit = false,
}: ContentChecklistGridProps) {
  const rowTotal = (contentTypeId: string) =>
    DAY_LABELS.reduce((sum, _, day) => sum + getPostCount(entries, contentTypeId, day), 0);

  const dayTotal = (day: number) =>
    contentTypes.reduce((sum, type) => sum + getPostCount(entries, type.id, day), 0);

  const grandTotal = entries.reduce(
    (sum, e) => sum + (e.postCount ?? (e.posted ? 1 : 0)),
    0
  );

  const doneSlots = entries.filter(
    (e) => (e.postCount ?? 0) > 0 || e.posted
  ).length;

  return (
    <div className="overflow-x-auto rounded-xl border border-icvf-border bg-white">
      <p className="border-b border-icvf-border bg-icvf-surface/40 px-4 py-2 text-xs text-icvf-text-light">
        Tick the checkbox when uploaded. Adjust the count if you posted more than once that day.
      </p>
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-icvf-border bg-icvf-surface/60">
            <th className="px-4 py-3 text-left font-semibold text-icvf-navy">Content type</th>
            {DAY_LABELS.map((day) => (
              <th key={day} className="px-2 py-3 text-center font-semibold text-icvf-navy">
                {day}
              </th>
            ))}
            <th className="px-3 py-3 text-center font-semibold text-icvf-navy">Week total</th>
          </tr>
        </thead>
        <tbody>
          {contentTypes.map((type) => (
            <tr key={type.id} className="border-b border-icvf-border last:border-0">
              <td className="px-4 py-3 font-medium text-icvf-navy">
                <div className="flex items-center gap-3">
                  <SocialBrandIcon slug={type.slug} kind="content" />
                  <span>{type.name}</span>
                </div>
              </td>
              {DAY_LABELS.map((_, day) => {
                const count = getPostCount(entries, type.id, day);
                const entry = entries.find(
                  (e) => e.contentTypeId === type.id && e.dayOfWeek === day
                );
                return (
                  <td key={day} className="px-2 py-3 text-center">
                    <UploadDayCell
                      key={`${type.id}-${day}-${entry?.updatedAt ?? "new"}-${count}`}
                      contentTypeId={type.id}
                      contentTypeName={type.name}
                      day={day}
                      initialCount={count}
                      onUpdateCount={onUpdateCount}
                      showAudit={showAudit}
                      updatedBy={entry?.updatedBy}
                    />
                  </td>
                );
              })}
              <td className="px-3 py-3 text-center text-base font-bold tabular-nums text-icvf-navy">
                {rowTotal(type.id)}
              </td>
            </tr>
          ))}
          <tr className="bg-icvf-surface/40">
            <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-icvf-text-light">
              Daily total
            </td>
            {DAY_LABELS.map((_, day) => (
              <td
                key={day}
                className="px-2 py-3 text-center text-sm font-semibold tabular-nums text-icvf-navy"
              >
                {dayTotal(day)}
              </td>
            ))}
            <td className="px-3 py-3 text-center text-sm font-bold tabular-nums text-icvf-navy">
              {grandTotal}
              <span className="mt-0.5 block text-[10px] font-normal text-icvf-text-light">
                {doneSlots} done
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
