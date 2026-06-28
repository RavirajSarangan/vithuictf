"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateList } from "@/components/certificates/certificate-list";
import { CertificateStatsCards } from "@/components/certificates/certificate-stats-cards";
import { CertificateBatchList } from "@/components/certificates/certificate-batch-list";
import { useCertificates } from "@/hooks/use-certificates";

const ManualIssueForm = dynamic(
  () => import("@/components/certificates/manual-issue-form").then((m) => m.ManualIssueForm),
  { loading: () => <p className="text-sm text-muted-foreground">Loading form…</p> }
);

const BulkIssueWizard = dynamic(
  () => import("@/components/certificates/bulk-issue-wizard").then((m) => m.BulkIssueWizard),
  { loading: () => <p className="text-sm text-muted-foreground">Loading bulk wizard…</p> }
);

const CertificateTemplatePanel = dynamic(
  () =>
    import("@/components/certificates/certificate-template-panel").then(
      (m) => m.CertificateTemplatePanel
    ),
  { loading: () => <p className="text-sm text-muted-foreground">Loading template…</p> }
);

type CertificateTab = "certificates" | "manual" | "bulk" | "template";

export function CertificateDashboard() {
  const [activeTab, setActiveTab] = useState<CertificateTab>("certificates");
  const { certificates, batches, template, stats, loading, refresh } = useCertificates();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Certificates"
        description="Issue certificates manually or in bulk, then manage delivery"
      />

      <CertificateStatsCards stats={stats} loading={loading} />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as CertificateTab)}
        className="flex flex-col gap-4"
      >
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="certificates">All certificates</TabsTrigger>
          <TabsTrigger value="manual">Manual issue</TabsTrigger>
          <TabsTrigger value="bulk">Bulk issue</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
        </TabsList>

        {activeTab === "certificates" ? (
          <TabsContent value="certificates" className="flex flex-col gap-6">
            <CertificateBatchList batches={batches} onRefresh={refresh} />
            <CertificateList certificates={certificates} onRefresh={refresh} />
          </TabsContent>
        ) : null}

        {activeTab === "manual" ? (
          <TabsContent value="manual">
            <ManualIssueForm onComplete={refresh} />
          </TabsContent>
        ) : null}

        {activeTab === "bulk" ? (
          <TabsContent value="bulk">
            <BulkIssueWizard onComplete={refresh} />
          </TabsContent>
        ) : null}

        {activeTab === "template" ? (
          <TabsContent value="template">
            <CertificateTemplatePanel template={template} onUpdated={refresh} />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
