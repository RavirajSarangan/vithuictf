"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPaperCenterMapPosition } from "@/lib/data/sri-lanka-map-coords";
import type { PaperCenter } from "@/types";

interface SriLankaCentersMapProps {
  centers: PaperCenter[];
  className?: string;
}

export function SriLankaCentersMap({ centers, className }: SriLankaCentersMapProps) {
  const activeCenters = useMemo(() => centers.filter((c) => c.isActive), [centers]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    activeCenters.find((c) => c.id === selectedId) ?? activeCenters[0] ?? null;

  const markers = useMemo(
    () =>
      activeCenters.map((center) => ({
        center,
        position: getPaperCenterMapPosition(center.district, center.mapX, center.mapY),
      })),
    [activeCenters]
  );

  if (!activeCenters.length) return null;

  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr]",
        className
      )}
    >
      <div className="relative min-h-[320px] border-b border-white/10 p-6 sm:min-h-[380px] lg:border-b-0 lg:border-r">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Exam Paper Centers · Map
        </p>

        <div className="relative mx-auto aspect-square w-full max-w-[320px]">
          <div className="absolute inset-0 rounded-full bg-icvf-accent/10 blur-3xl" />
          <Image
            src="/landing/sri-lanka-map.svg"
            alt=""
            className="relative h-full w-full object-contain drop-shadow-[0_0_28px_rgba(245,166,35,0.35)]"
            width={320}
            height={320}
            priority
          />

          {markers.map(({ center, position }) => {
            const isSelected = selected?.id === center.id;
            return (
              <button
                key={center.id}
                type="button"
                aria-label={`${center.name}, ${center.district}`}
                onClick={() => setSelectedId(center.id)}
                className="absolute -translate-x-1/2 -translate-y-[calc(100%-4px)] pb-2"
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
              >
                {/* Coordinate pulsing halo */}
                <span
                  className={cn(
                    "absolute bottom-0.5 left-1/2 size-5 -translate-x-1/2 rounded-full bg-icvf-accent/30 animate-ping",
                    isSelected ? "opacity-75" : "opacity-0"
                  )}
                />
                {/* Coordinate dot */}
                <span className="absolute bottom-1.5 left-1/2 size-2 -translate-x-1/2 rounded-full border border-white/20 bg-icvf-accent shadow-sm" />

                {/* Floating Glassmorphic Pin Head */}
                <span
                  className={cn(
                    "relative flex size-7 items-center justify-center rounded-full border bg-white/45 backdrop-blur-[4px] shadow-lg transition-transform hover:scale-110",
                    "after:absolute after:bottom-[-4.5px] after:left-1/2 after:size-2.5 after:-translate-x-1/2 after:rotate-45 after:border-b after:border-r after:bg-white/45 after:backdrop-blur-[4px]",
                    isSelected
                      ? "border-icvf-accent scale-110 bg-white/65 after:bg-white/65 after:border-icvf-accent"
                      : "border-white/50 after:border-white/50"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/favicon.png"
                    alt=""
                    className="relative z-10 size-4 object-contain"
                  />
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-white/45">
          Tap a point to view paper center details
        </p>
      </div>

      <div className="flex flex-col p-6">
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 rounded-2xl border border-icvf-accent/25 bg-icvf-accent/10 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-icvf-accent/20">
                  <FileText className="size-5 text-icvf-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-icvf-accent">
                    Exam Paper Center
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">{selected.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                    <MapPin className="size-3.5 shrink-0 text-icvf-accent" />
                    {selected.district}
                    {selected.address ? ` · ${selected.address}` : ""}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
          All Centers
        </p>
        <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {activeCenters.map((center) => (
            <li key={center.id}>
              <button
                type="button"
                onClick={() => setSelectedId(center.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors",
                  selected?.id === center.id
                    ? "bg-icvf-accent/20 ring-1 ring-icvf-accent/35"
                    : "bg-white/[0.05] hover:bg-white/[0.08]"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-white">{center.district}</p>
                  <p className="text-xs text-white/50">{center.name}</p>
                </div>
                <MapPin className="size-4 shrink-0 text-icvf-accent/80" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
