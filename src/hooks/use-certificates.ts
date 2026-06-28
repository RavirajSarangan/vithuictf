import { createClient } from "@/lib/supabase/client";
import { mapCertificate } from "@/lib/supabase/mappers";
import type { Certificate, CertificateBatch, CertificateTemplate } from "@/types";
import { useCallback, useEffect, useState } from "react";
import {
  ensureDefaultCertificateTemplate,
  getCertificateStats,
  listCertificateBatches,
  listCertificatesForAdmin,
  type CertificateListItem,
} from "@/lib/actions/certificates";

export function useCertificates() {
  const [certificates, setCertificates] = useState<CertificateListItem[]>([]);
  const [batches, setBatches] = useState<CertificateBatch[]>([]);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, pendingDelivery: 0 });
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      listCertificatesForAdmin(),
      listCertificateBatches(),
      ensureDefaultCertificateTemplate(),
      getCertificateStats(),
    ])
      .then(([certRows, batchRows, activeTemplate, statRows]) => {
        if (cancelled) return;
        setCertificates(certRows);
        setBatches(batchRows);
        setTemplate(activeTemplate);
        setStats(statRows);
      })
      .catch(() => {
        if (cancelled) return;
        createClient()
          .from("certificates")
          .select("*")
          .order("issued_at", { ascending: false })
          .then(({ data }) => {
            if (!cancelled) setCertificates((data ?? []).map(mapCertificate) as CertificateListItem[]);
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [version]);

  return { certificates, batches, template, stats, loading, refresh };
}

export type { CertificateListItem };
