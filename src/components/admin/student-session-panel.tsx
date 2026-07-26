"use client";

import { useCallback, useEffect, useState } from "react";
import { forceLogoutStudentSession, getStudentSessionHistory } from "@/lib/actions/student-sessions";
import { mapStudentSession } from "@/lib/supabase/mappers";
import type { StudentSession } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getActionErrorMessage } from "@/lib/action-error";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const REVOKED_REASON_LABEL: Record<string, string> = {
  new_login: "Replaced by new login",
  manual_logout: "Signed out",
  admin_force: "Force logged out",
  expired: "Expired",
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function StudentSessionPanel({ studentRowId }: { studentRowId: string }) {
  const [sessions, setSessions] = useState<StudentSession[] | null>(null);
  const [forcingId, setForcingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await getStudentSessionHistory(studentRowId);
      setSessions(rows.map(mapStudentSession));
    } catch {
      setSessions([]);
    }
  }, [studentRowId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleForceLogout = async (sessionId: string) => {
    setForcingId(sessionId);
    try {
      await forceLogoutStudentSession(sessionId);
      toast.success("Session logged out");
      await load();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to force logout"));
    } finally {
      setForcingId(null);
    }
  };

  if (sessions === null) {
    return <Skeleton className="h-40 w-full bg-muted" />;
  }

  const active = sessions.find((s) => !s.revokedAt);
  const history = sessions.filter((s) => s.revokedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session &amp; Login Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {active ? (
          <div className="flex flex-col gap-2 rounded-lg border border-icvf-border p-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-100 text-emerald-700">Active session</Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={forcingId === active.id}
                onClick={() => void handleForceLogout(active.id)}
              >
                <LogOut className="mr-2 size-4" /> Force logout
              </Button>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Device</span>
              <span className="text-icvf-navy">{active.deviceLabel ?? "Unknown device"}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IP address</span>
              <span className="font-mono text-icvf-navy">{active.ipAddress ?? "—"}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Logged in</span>
              <span className="text-icvf-navy">{formatDateTime(active.createdAt)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Last seen</span>
              <span className="text-icvf-navy">{formatDateTime(active.lastSeenAt)}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No active session.</p>
        )}

        {history.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Login history</p>
            <div className="space-y-2">
              {history.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-1 rounded-lg border border-icvf-border/60 p-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-icvf-navy">{s.deviceLabel ?? "Unknown device"}</span>
                  <span className="font-mono text-muted-foreground">{s.ipAddress ?? "—"}</span>
                  <span className="text-muted-foreground">{formatDateTime(s.createdAt)}</span>
                  <Badge variant="outline">
                    {(s.revokedReason && REVOKED_REASON_LABEL[s.revokedReason]) ?? "Ended"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
