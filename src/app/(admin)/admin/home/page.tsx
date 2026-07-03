"use client";

import { useMemo, useState } from "react";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  useAdminClassPrograms,
  useAdminCompanies,
  useAdminFeaturedRankings,
  useAdminPaperCenters,
  useHomeAbout,
  useNetworkStats,
  useSiteStats,
} from "@/hooks/use-data";
import {
  addClassProgram,
  addCompany,
  addFeaturedRanking,
  addPaperCenter,
  deleteClassProgram,
  deleteCompany,
  deleteFeaturedRanking,
  deletePaperCenter,
  updateHomeAbout,
  updateNetworkStats,
  updateSiteStats,
} from "@/lib/actions/admin";
import {
  bulkDeleteCompanies,
  bulkDeleteClassPrograms,
  bulkDeletePaperCenters,
  bulkDeleteFeaturedRankings,
} from "@/lib/actions/bulk-delete";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { DeleteConfirmDialog } from "@/components/admin/bulk-delete-dialog";
import { useBulkDeleteHandler } from "@/hooks/use-bulk-delete";
import { genericTableSummary } from "@/lib/table-insights";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";
import { AdminMarketingVisibilityPanel } from "@/components/admin/admin-marketing-visibility-panel";
import { AdminAnnouncementsPanel } from "@/components/admin/admin-announcements-panel";
import { AdminEmailTestPanel } from "@/components/admin/admin-email-test-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";

export default function AdminHomePage() {
  const stats = useSiteStats();
  const network = useNetworkStats();
  const about = useHomeAbout();
  const companies = useAdminCompanies();
  const programs = useAdminClassPrograms();
  const centers = useAdminPaperCenters();
  const rankings = useAdminFeaturedRankings();
  const [siteForm, setSiteForm] = useState<Record<string, number>>({});
  const [networkForm, setNetworkForm] = useState<Record<string, string | number>>({});
  const [aboutForm, setAboutForm] = useState<Record<string, string | number>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleBulkDeleteCompanies = useBulkDeleteHandler(bulkDeleteCompanies, "company", companies.refresh);
  const handleBulkDeletePrograms = useBulkDeleteHandler(bulkDeleteClassPrograms, "program", programs.refresh);
  const handleBulkDeleteCenters = useBulkDeleteHandler(bulkDeletePaperCenters, "center", centers.refresh);
  const handleBulkDeleteRankings = useBulkDeleteHandler(bulkDeleteFeaturedRankings, "ranking", rankings.refresh);

  const companiesSummary = useMemo(() => genericTableSummary(companies.data, "Companies"), [companies.data]);
  const programsSummary = useMemo(() => genericTableSummary(programs.data, "Programs"), [programs.data]);
  const centersSummary = useMemo(() => genericTableSummary(centers.data, "Centers"), [centers.data]);
  const rankingsSummary = useMemo(() => genericTableSummary(rankings.data, "Rankings"), [rankings.data]);

  const crud = async (fn: () => Promise<void>, refresh: () => void, label: string) => {
    try {
      await fn();
      refresh();
      toast.success(`${label} updated`);
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "company") await deleteCompany(deleteTarget.id);
      else if (deleteTarget.type === "program") await deleteClassProgram(deleteTarget.id);
      else if (deleteTarget.type === "center") await deletePaperCenter(deleteTarget.id);
      else if (deleteTarget.type === "ranking") await deleteFeaturedRanking(deleteTarget.id);
      if (deleteTarget.type === "company") companies.refresh();
      else if (deleteTarget.type === "program") programs.refresh();
      else if (deleteTarget.type === "center") centers.refresh();
      else if (deleteTarget.type === "ranking") rankings.refresh();
      toast.success("Deleted");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Home Content" description="Manage marketing site stats, CMS content, and featured data" />
    <Tabs defaultValue="visibility" className="flex flex-col gap-4">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="visibility">Visibility</TabsTrigger>
        <TabsTrigger value="announcements">Announcements</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="stats">Site Stats</TabsTrigger>
        <TabsTrigger value="network">Network</TabsTrigger>
        <TabsTrigger value="about">Founder</TabsTrigger>
        <TabsTrigger value="companies">Companies</TabsTrigger>
        <TabsTrigger value="programs">Programs</TabsTrigger>
        <TabsTrigger value="centers">Centers</TabsTrigger>
        <TabsTrigger value="rankings">Rankings</TabsTrigger>
      </TabsList>
      <TabsContent value="visibility">
        <AdminMarketingVisibilityPanel />
      </TabsContent>
      <TabsContent value="announcements">
        <AdminAnnouncementsPanel />
      </TabsContent>
      <TabsContent value="email">
        <AdminEmailTestPanel />
      </TabsContent>
      <TabsContent value="stats" className="grid max-w-xl gap-4">
        {stats &&
          (["students", "courses", "satisfaction", "resources", "yearsExperience", "certifiedTeachers", "successRate"] as const).map(
            (key) => (
              <div key={key}>
                <label className="text-sm font-medium">{key}</label>
                <Input
                  type="number"
                  defaultValue={stats[key]}
                  onChange={(e) => setSiteForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                />
              </div>
            )
          )}
        <Button
          className="w-fit"
          onClick={async () => {
            if (!stats) return;
            const data = { ...stats, ...siteForm };
            await updateSiteStats(data);
            toast.success("Saved");
          }}
        >
          Save Site Stats
        </Button>
      </TabsContent>
      <TabsContent value="network" className="grid max-w-xl gap-4">
        {network && (
          <>
            {(["paperCentersCount", "districtsCovered", "passRate", "papersWritten"] as const).map((key) => (
              <div key={key}>
                <label className="text-sm font-medium">{key}</label>
                <Input
                  type="number"
                  defaultValue={network[key]}
                  onChange={(e) => setNetworkForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                />
              </div>
            ))}
            {(["headline", "headlineTa", "subheadline", "subheadlineTa", "ctaLabel", "ctaLabelTa", "ctaUrl"] as const).map(
              (key) => (
                <div key={key}>
                  <label className="text-sm font-medium">{key}</label>
                  <Input
                    defaultValue={String(network[key] ?? "")}
                    onChange={(e) => setNetworkForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              )
            )}
            <Button
              className="w-fit"
              onClick={async () => {
                if (!network) return;
                const data = { ...network, ...networkForm };
                await updateNetworkStats(data);
                toast.success("Saved");
              }}
            >
              Save Network
            </Button>
          </>
        )}
      </TabsContent>
      <TabsContent value="about" className="grid max-w-xl gap-4">
        {about && (
          <>
            {(["name", "title", "titleTa", "credentials", "ctaLabel", "ctaUrl"] as const).map((key) => (
              <div key={key}>
                <label className="text-sm font-medium">{key}</label>
                <Input
                  defaultValue={String(about[key] ?? "")}
                  onChange={(e) => setAboutForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <AdminImageUpload
              label="photoUrl"
              value={String(aboutForm.photoUrl ?? about.photoUrl ?? "")}
              folder="founder"
              onChange={(url) => setAboutForm((f) => ({ ...f, photoUrl: url }))}
            />
            <div>
              <label className="text-sm font-medium">bio</label>
              <Textarea
                defaultValue={about.bio}
                onChange={(e) => setAboutForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">bioTa</label>
              <Textarea
                defaultValue={about.bioTa ?? ""}
                onChange={(e) => setAboutForm((f) => ({ ...f, bioTa: e.target.value }))}
              />
            </div>
            {(["highlightStudents", "highlightExperienceYears"] as const).map((key) => (
              <div key={key}>
                <label className="text-sm font-medium">{key}</label>
                <Input
                  type="number"
                  defaultValue={about[key]}
                  onChange={(e) => setAboutForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                />
              </div>
            ))}
            <Button
              className="w-fit"
              onClick={async () => {
                if (!about) return;
                const data = { ...about, ...aboutForm };
                await updateHomeAbout(data);
                toast.success("Saved");
              }}
            >
              Save About
            </Button>
          </>
        )}
      </TabsContent>
      <TabsContent value="companies">
        <div className="mb-4 flex justify-end">
          <Button
            
            onClick={() =>
              crud(
                () => addCompany({ name: "New Company", location: "", description: "" }),
                companies.refresh,
                "Company"
              )
            }
          >
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>
        <AdminTableSection
          columns={[
            { key: "name", label: "Name" },
            { key: "location", label: "Location" },
          ]}
          data={companies.data}
          summaryItems={companiesSummary}
          entityLabel="company"
          onBulkDelete={handleBulkDeleteCompanies}
          onDelete={(id) => {
            const row = companies.data.find((c) => c.id === id);
            if (row) setDeleteTarget({ type: "company", id, label: row.name });
          }}
          onActionComplete={companies.refresh}
        />
      </TabsContent>
      <TabsContent value="programs">
        <div className="mb-4 flex justify-end">
          <Button
            
            onClick={() =>
              crud(
                () => addClassProgram({ title: "New Program", description: "" }),
                programs.refresh,
                "Program"
              )
            }
          >
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>
        <AdminTableSection
          columns={[
            { key: "title", label: "Title" },
            { key: "description", label: "Description" },
          ]}
          data={programs.data}
          summaryItems={programsSummary}
          entityLabel="program"
          onBulkDelete={handleBulkDeletePrograms}
          onDelete={(id) => {
            const row = programs.data.find((p) => p.id === id);
            if (row) setDeleteTarget({ type: "program", id, label: row.title });
          }}
          onActionComplete={programs.refresh}
        />
      </TabsContent>
      <TabsContent value="centers">
        <div className="mb-4 flex justify-end">
          <Button
            
            onClick={() =>
              crud(
                () => addPaperCenter({ name: "New Center", district: "", address: "" }),
                centers.refresh,
                "Center"
              )
            }
          >
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>
        <AdminTableSection
          columns={[
            { key: "name", label: "Name" },
            { key: "district", label: "District" },
          ]}
          data={centers.data}
          summaryItems={centersSummary}
          entityLabel="center"
          onBulkDelete={handleBulkDeleteCenters}
          onDelete={(id) => {
            const row = centers.data.find((c) => c.id === id);
            if (row) setDeleteTarget({ type: "center", id, label: row.name });
          }}
          onActionComplete={centers.refresh}
        />
      </TabsContent>
      <TabsContent value="rankings">
        <div className="mb-4 flex justify-end">
          <Button
            
            onClick={() =>
              crud(
                () =>
                  addFeaturedRanking({
                    studentName: "New Student",
                    rankType: "class",
                    score: 90,
                  }),
                rankings.refresh,
                "Ranking"
              )
            }
          >
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>
        <AdminTableSection
          columns={[
            { key: "studentName", label: "Student" },
            { key: "rankType", label: "Type" },
            { key: "score", label: "Score" },
          ]}
          data={rankings.data}
          summaryItems={rankingsSummary}
          entityLabel="ranking"
          onBulkDelete={handleBulkDeleteRankings}
          onDelete={(id) => {
            const row = rankings.data.find((r) => r.id === id);
            if (row) setDeleteTarget({ type: "ranking", id, label: row.studentName });
          }}
          onActionComplete={rankings.refresh}
        />
      </TabsContent>
    </Tabs>

    <DeleteConfirmDialog
      open={!!deleteTarget}
      onOpenChange={(open) => !open && setDeleteTarget(null)}
      entityLabel={deleteTarget?.label ?? "item"}
      deleting={deleting}
      onConfirm={handleConfirmDelete}
    />
    </div>
  );
}
