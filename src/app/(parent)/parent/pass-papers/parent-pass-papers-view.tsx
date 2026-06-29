"use client";

import { PassPaperBrowserLazy } from "@/components/pass-papers/pass-paper-browser-lazy";
import { usePassPaperBrowse } from "@/hooks/use-pass-papers";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";

export default function ParentPassPapersPage({ pathSlugs = [] }: { pathSlugs?: string[] }) {
  const { folders, items, loading } = usePassPaperBrowse(true);

  if (loading) return <StudentPageLoading rows={2} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pass Papers</h1>
        <p className="text-sm text-white/70">
          Browse G.C.E. O/L, A/L, and scholarship past papers.
        </p>
      </div>
      <PassPaperBrowserLazy
        folders={folders}
        items={items}
        loading={loading}
        basePath="/parent/pass-papers"
        pathSlugs={pathSlugs}
      />
    </div>
  );
}
