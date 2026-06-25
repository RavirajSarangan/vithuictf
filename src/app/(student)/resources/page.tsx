"use client";

import { useState, useMemo } from "react";
import { useResources } from "@/hooks/use-data";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { GlassCard } from "@/components/shared/glass-card";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Video, ClipboardList, Search, Eye, Star, Bookmark } from "lucide-react";
import { ResourceViewer } from "@/components/student/resource-viewer";
import type { Resource, ResourceCategory } from "@/types";
import { cn } from "@/lib/utils";

const categories: { id: ResourceCategory | "all" | "bookmarked"; label: string; icon: typeof BookOpen }[] = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "bookmarked", label: "Bookmarked", icon: Bookmark },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "past_papers", label: "Past Papers", icon: FileText },
  { id: "videos", label: "Videos", icon: Video },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "study_guides", label: "Study Guides", icon: BookOpen },
];

export default function ResourcesPage() {
  const { resources, isLoading } = useResources();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ResourceCategory | "all" | "bookmarked">("all");
  const [viewing, setViewing] = useState<Resource | null>(null);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchCat =
        category === "all" ||
        (category === "bookmarked" ? isBookmarked(r.id) : r.category === category);
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [resources, category, search, isBookmarked]);

  const popularIds = useMemo(() => {
    return new Set(resources.filter((r) => r.popular).slice(0, 3).map((r) => r.id));
  }, [resources]);

  const popular = useMemo(() => {
    return resources.filter((r) => popularIds.has(r.id));
  }, [resources, popularIds]);

  const mainGrid = useMemo(() => {
    if (category === "all" && !search) {
      return filtered.filter((r) => !popularIds.has(r.id));
    }
    return filtered;
  }, [filtered, category, search, popularIds]);

  if (isLoading) {
    return <StudentPageLoading rows={3} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Resources"
        description="Notes, past papers, videos, and study materials for your course."
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-icvf-text-light" />
        <Input
          placeholder="Search resources..."
          className="h-11 rounded-xl border-icvf-border pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs
        value={category}
        onValueChange={(v) => setCategory(v as ResourceCategory | "all" | "bookmarked")}
        className="min-w-0 gap-0"
      >
        <div className="relative min-w-0">
          <div className="overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="inline-flex h-auto w-max max-w-none flex-nowrap items-center gap-1 bg-icvf-surface p-1">
              {categories.map((c) => (
                <TabsTrigger key={c.id} value={c.id} className="shrink-0 flex-none rounded-lg px-3 py-2">
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden"
          />
        </div>
      </Tabs>

      {popular.length > 0 && category === "all" && !search ? (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-icvf-navy">
            <Star className="size-4 text-icvf-accent" /> Popular resources
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {popular.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                bookmarked={isBookmarked(r.id)}
                onToggleBookmark={() => void toggleBookmark(r.id)}
                onView={() => setViewing(r)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {mainGrid.length === 0 && filtered.length === 0 ? (
        <StudentEmptyState message="No resources match your search. Try another category or clear the search box." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {mainGrid.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              bookmarked={isBookmarked(r.id)}
              onToggleBookmark={() => void toggleBookmark(r.id)}
              onView={() => setViewing(r)}
            />
          ))}
        </div>
      )}

      {viewing ? <ResourceViewer resource={viewing} onClose={() => setViewing(null)} /> : null}
    </div>
  );
}

function ResourceCard({
  resource,
  bookmarked,
  onToggleBookmark,
  onView,
}: {
  resource: Resource;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onView: () => void;
}) {
  return (
    <GlassCard className="flex h-full flex-col transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className="capitalize border-icvf-border">
          {resource.category.replace("_", " ")}
        </Badge>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            className={cn("text-icvf-text-light hover:text-icvf-accent", bookmarked && "text-icvf-accent")}
          >
            <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
          </button>
          <Badge className="bg-icvf-navy/10 text-icvf-navy">{resource.type.toUpperCase()}</Badge>
        </div>
      </div>
      <h3 className="mt-3 font-semibold text-icvf-navy">{resource.title}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-icvf-text-light">{resource.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-icvf-text-light">{resource.views} views</span>
        <button
          type="button"
          onClick={onView}
          className="flex min-h-10 items-center gap-1 text-sm font-semibold text-icvf-accent hover:text-icvf-accent-hover"
        >
          <Eye className="size-4" /> View
        </button>
      </div>
    </GlassCard>
  );
}
