"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addIctfTeamMember,
  deleteIctfTeamMember,
  sendIctfTeamMemberEmail,
  updateIctfTeamMember,
  uploadIctfTeamImage,
} from "@/lib/actions/admin";
import { useAdminIctfTeam } from "@/hooks/use-data";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SummaryCardItem } from "@/components/admin/table-summary-cards";
import { Loader2, Mail, Pencil, Plus, Send, Users } from "lucide-react";
import { toast } from "sonner";
import type { IctfTeamMember } from "@/types";

const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();

const memberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  bio: z.string().optional(),
  photoUrl: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  whatsapp: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  dateOfBirth: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker"), z.literal("")])
    .optional(),
  isLead: z.boolean(),
  sortOrder: z.number().min(0).max(999),
});

type MemberFormValues = z.infer<typeof memberSchema>;

const DEFAULT_VALUES: MemberFormValues = {
  name: "",
  role: "",
  bio: "",
  photoUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  whatsapp: "",
  email: "",
  dateOfBirth: "",
  isLead: false,
  sortOrder: 0,
};

function formatBirthday(dateOfBirth: string): string {
  const [, month, day] = dateOfBirth.split("-").map(Number);
  if (!month || !day) return "";
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isBirthdayToday(dateOfBirth: string): boolean {
  const [, month, day] = dateOfBirth.split("-").map(Number);
  const now = new Date();
  return month === now.getMonth() + 1 && day === now.getDate();
}

export default function AdminIctfTeamPage() {
  const { data, refresh } = useAdminIctfTeam();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IctfTeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IctfTeamMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailTarget, setEmailTarget] = useState<IctfTeamMember | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const summaryItems = useMemo<SummaryCardItem[]>(
    () => [{ label: "Team members", value: data.length }],
    [data]
  );

  const columns = useMemo(
    () => [
      {
        key: "photoUrl",
        label: "",
        render: (row: IctfTeamMember) =>
          row.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.photoUrl}
              alt={row.name}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-4" />
            </span>
          ),
      },
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      {
        key: "dateOfBirth",
        label: "Birthday",
        render: (row: IctfTeamMember) =>
          row.dateOfBirth ? (
            <span className="whitespace-nowrap">
              {formatBirthday(row.dateOfBirth)}
              {isBirthdayToday(row.dateOfBirth) && " 🎂"}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "isLead",
        label: "Lead",
        render: (row: IctfTeamMember) =>
          row.isLead ? <Badge variant="outline">Lead</Badge> : <span className="text-muted-foreground">—</span>,
      },
      { key: "sortOrder", label: "Order" },
      {
        key: "email",
        label: "Contact",
        render: (row: IctfTeamMember) =>
          row.email ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setEmailSubject("");
                setEmailMessage("");
                setEmailTarget(row);
              }}
            >
              <Mail className="mr-1.5 size-3.5" /> Email
            </Button>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    []
  );

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(DEFAULT_VALUES);
    setOpen(true);
  };

  const openEdit = (member: IctfTeamMember) => {
    setEditing(member);
    form.reset({
      name: member.name,
      role: member.role,
      bio: member.bio,
      photoUrl: member.photoUrl,
      facebookUrl: member.facebookUrl,
      instagramUrl: member.instagramUrl,
      linkedinUrl: member.linkedinUrl,
      youtubeUrl: member.youtubeUrl,
      whatsapp: member.whatsapp,
      email: member.email,
      dateOfBirth: member.dateOfBirth,
      isLead: member.isLead,
      sortOrder: member.sortOrder,
    });
    setOpen(true);
  };

  const onSubmit = async (values: MemberFormValues) => {
    setSubmitting(true);
    try {
      const result = editing
        ? await updateIctfTeamMember(editing.id, values)
        : await addIctfTeamMember(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Team member updated" : "Team member added");
      refresh();
      setOpen(false);
    } catch {
      toast.error("Failed to save team member");
    } finally {
      setSubmitting(false);
    }
  };

  const sendMemberEmail = async () => {
    if (!emailTarget) return;
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSendingEmail(true);
    try {
      const result = await sendIctfTeamMemberEmail(emailTarget.id, emailSubject, emailMessage);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Email sent to ${emailTarget.name}`);
      setEmailTarget(null);
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteIctfTeamMember(deleteTarget.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
      toast.success("Team member deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ICTF Team"
        description="Manage the public team member profiles shown on /ictf-team"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Add member
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Add your first ICTF team member"
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Add member
            </Button>
          }
        />
      ) : (
        <AdminTableSection
          data={data}
          columns={columns}
          summaryItems={summaryItems}
          entityLabel="team member"
          onDelete={(id) => setDeleteTarget(data.find((m) => m.id === id) ?? null)}
          onView={(row) => openEdit(row)}
          onActionComplete={refresh}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90dvh,calc(100vh-2rem))] overflow-y-auto overscroll-contain sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit team member" : "Add team member"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-1">
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AdminImageUpload
                        label="Photo"
                        folder="ictf-team"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        uploadAction={uploadIctfTeamImage}
                        requireSquare
                        hint="Square image recommended. JPG/PNG uploads are auto-converted to WebP."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role / title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Lead Instructor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="facebookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://facebook.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagramUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://instagram.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://linkedin.com/in/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://youtube.com/@..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+94771234567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="name@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Used to send an automatic birthday email at 9:00 AM.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isLead"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Featured leader</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Show at the top of the org chart on the public team page.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={999}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : editing ? (
                  <>
                    <Pencil className="mr-2 size-4" /> Update member
                  </>
                ) : (
                  "Save member"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!emailTarget} onOpenChange={(v) => !v && setEmailTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Email {emailTarget?.name ?? "team member"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Sends a branded ICTF email to {emailTarget?.email}.
            </p>
            <div className="flex flex-col gap-2">
              <label htmlFor="team-email-subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="team-email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="A quick note from ICTF"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="team-email-message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="team-email-message"
                rows={6}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Write your message..."
              />
            </div>
            <Button onClick={sendMemberEmail} disabled={sendingEmail}>
              {sendingEmail ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" /> Send email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name ?? "member"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the team member from the public ICTF Team page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
