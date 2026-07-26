"use client";

import { useEffect, useState } from "react";
import {
  STAFF_FEATURE_KEYS,
  STAFF_FEATURE_LABELS,
  getStaffFeaturePermissions,
  updateStaffFeaturePermissions,
} from "@/lib/actions/staff-permissions";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { StaffFeatureKey } from "@/lib/actions/auth";

export function StaffFeaturePermissionsDialog({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<StaffFeatureKey, boolean> | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getStaffFeaturePermissions(userId)
      .then((result) => {
        if (result.ok) {
          setPermissions(result.data);
        } else {
          toast.error(result.error);
        }
      })
      .catch((error) => toast.error(getActionErrorMessage(error, "Failed to load feature access")))
      .finally(() => setLoading(false));
  }, [open, userId]);

  async function handleSave() {
    if (!permissions) return;
    setSaving(true);
    const result = await updateStaffFeaturePermissions(userId, permissions);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Feature access updated");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <ShieldCheck className="mr-1 size-3.5" /> Access
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feature access — {displayName}</DialogTitle>
          <DialogDescription>
            Everything is allowed by default. Turn a section off to block this teacher from it
            specifically, without changing anyone else&apos;s access.
          </DialogDescription>
        </DialogHeader>

        {loading || !permissions ? (
          <Skeleton className="h-40 w-full bg-muted" />
        ) : (
          <div className="flex flex-col gap-3">
            {STAFF_FEATURE_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-icvf-border p-3"
              >
                <Label htmlFor={`feature-${key}`}>{STAFF_FEATURE_LABELS[key]}</Label>
                <Switch
                  id={`feature-${key}`}
                  checked={permissions[key]}
                  onCheckedChange={(checked) =>
                    setPermissions((prev) => (prev ? { ...prev, [key]: checked } : prev))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving || loading}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
