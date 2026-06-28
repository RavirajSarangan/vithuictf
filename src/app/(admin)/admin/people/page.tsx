"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addAdmin,
  addStaffMember,
  deleteAdmin,
  deleteStaffMember,
  demoteAdminToTeacher,
  promoteTeacherToAdmin,
  resetAdminPassword,
  resetStaffPassword,
  setStaffMemberActive,
  updateStaffMember,
} from "@/lib/actions/admin";
import {
  addContentManager,
  deleteContentManager,
  resetContentManagerPassword,
  setContentManagerActive,
} from "@/lib/actions/content-team";
import {
  addPaperCenterStaff,
  deletePaperCenterStaff,
  resetPaperCenterStaffPassword,
  setPaperCenterStaffActive,
} from "@/lib/actions/paper-center-staff";
import { useAdminCourses } from "@/hooks/use-data";
import { usePeopleRoster } from "@/hooks/use-people-roster";
import { usePaperCentersList } from "@/hooks/use-exam-papers";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PeopleRosterEntry } from "@/types";
import { Clapperboard, FileText, KeyRound, Loader2, Pencil, Plus, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { canCreateAdmins, canManageAdmins } from "@/lib/admin-access";
import { PasswordInput } from "@/components/ui/password-input";
import { USERNAME_PATTERN } from "@/lib/validation/register-student";

type PeopleTab = "all" | "staff" | "admins" | "content" | "paperCenter";

const staffSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    staffUsername: z
      .string()
      .optional()
      .refine((value) => !value?.trim() || USERNAME_PATTERN.test(value.trim().toLowerCase()), {
        message: "Use 3–20 letters, numbers, or underscores",
      }),
    email: z.string().email("Enter a valid email"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    courseIds: z.array(z.string()).optional(),
  })
  .superRefine((values, ctx) => {
    const password = values.password?.trim() ?? "";
    const confirm = values.confirmPassword?.trim() ?? "";
    if (password && password.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use at least 8 characters", path: ["password"] });
    }
    if (password !== confirm) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirmPassword"] });
    }
  });

const editStaffSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  staffUsername: z
    .string()
    .optional()
    .refine((value) => !value?.trim() || USERNAME_PATTERN.test(value.trim().toLowerCase()), {
      message: "Use 3–20 letters, numbers, or underscores",
    }),
  courseIds: z.array(z.string()).optional(),
  certified: z.boolean(),
});

const adminSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const password = values.password?.trim() ?? "";
    const confirm = values.confirmPassword?.trim() ?? "";
    if (password && password.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use at least 8 characters", path: ["password"] });
    }
    if (password !== confirm) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirmPassword"] });
    }
  });

const contentSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
});

const paperCenterSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    staffUsername: z
      .string()
      .min(3, "Username is required")
      .refine((value) => USERNAME_PATTERN.test(value.trim().toLowerCase()), {
        message: "Use 3–20 letters, numbers, or underscores",
      }),
    email: z.string().email("Enter a valid email"),
    paperCenterId: z.string().min(1, "Select a paper center"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const password = values.password?.trim() ?? "";
    const confirm = values.confirmPassword?.trim() ?? "";
    if (password && password.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use at least 8 characters", path: ["password"] });
    }
    if (password !== confirm) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirmPassword"] });
    }
  });

function roleBadge(role: PeopleRosterEntry["role"]) {
  if (role === "super_admin") return <Badge className="bg-amber-700">Super Admin</Badge>;
  if (role === "admin") return <Badge className="bg-icvf-navy">Admin</Badge>;
  if (role === "content_manager") return <Badge variant="secondary">Content</Badge>;
  if (role === "paper_center_staff") return <Badge variant="secondary">Paper Center</Badge>;
  return <Badge className="bg-icvf-accent">Staff</Badge>;
}

function CourseCheckboxes({
  value,
  onChange,
  courses,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  courses: { id: string; name: string }[];
}) {
  return (
    <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-input p-3">
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses available</p>
      ) : (
        courses.map((course) => {
          const checked = value.includes(course.id);
          return (
            <label key={course.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={checked}
                onCheckedChange={(next) => {
                  if (next) onChange([...value, course.id]);
                  else onChange(value.filter((id) => id !== course.id));
                }}
              />
              <span>{course.name}</span>
            </label>
          );
        })
      )}
    </div>
  );
}

function PeoplePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const manageAdmins = canManageAdmins(user?.role);
  const createAdmins = canCreateAdmins(user?.role);
  const rawTab = searchParams.get("tab");
  const tab: PeopleTab =
    rawTab === "teachers" ? "staff" : ((rawTab as PeopleTab | null) ?? "all");
  const { data, loading, refresh } = usePeopleRoster();
  const { data: courses } = useAdminCourses();
  const { centers: paperCenters } = usePaperCentersList();

  const [staffOpen, setStaffOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [paperCenterOpen, setPaperCenterOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<PeopleRosterEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const staffForm = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      displayName: "",
      staffUsername: "",
      email: "",
      password: "",
      confirmPassword: "",
      courseIds: [],
    },
  });

  const editForm = useForm<z.infer<typeof editStaffSchema>>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: { displayName: "", courseIds: [], certified: false },
  });

  const adminForm = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  const contentForm = useForm<z.infer<typeof contentSchema>>({
    resolver: zodResolver(contentSchema),
    defaultValues: { displayName: "", email: "" },
  });

  const paperCenterForm = useForm<z.infer<typeof paperCenterSchema>>({
    resolver: zodResolver(paperCenterSchema),
    defaultValues: {
      displayName: "",
      staffUsername: "",
      email: "",
      paperCenterId: "",
      password: "",
      confirmPassword: "",
    },
  });

  const setTab = (next: PeopleTab) => {
    router.replace(`/admin/people?tab=${next}`);
  };

  const filtered = useMemo(() => {
    if (tab === "staff") return data.filter((e) => e.role === "teacher");
    if (tab === "admins") return data.filter((e) => e.role === "admin" || e.role === "super_admin");
    if (tab === "content") return data.filter((e) => e.role === "content_manager");
    if (tab === "paperCenter") return data.filter((e) => e.role === "paper_center_staff");
    return data;
  }, [data, tab]);

  const openEditStaff = (entry: PeopleRosterEntry) => {
    setEditStaff(entry);
    editForm.reset({
      displayName: entry.displayName,
      staffUsername: entry.staffUsername ?? "",
      courseIds: entry.courseIds ?? [],
      certified: entry.certified ?? false,
    });
  };

  const handleAddStaff = async (values: z.infer<typeof staffSchema>) => {
    setSubmitting(true);
    try {
      const result = await addStaffMember({
        displayName: values.displayName,
        staffUsername: values.staffUsername,
        email: values.email,
        password: values.password?.trim() || undefined,
        courseIds: values.courseIds ?? [],
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
      setStaffOpen(false);
      staffForm.reset();
      toast.success(
        result.emailSent
          ? "Staff account created — login details emailed"
          : "Staff account created"
      );
      if (result.tempPassword) {
        toast.info(`Temporary password: ${result.tempPassword}`, { duration: 12000 });
      }
      if (!result.emailSent && result.emailError) {
        toast.warning(`Email not sent: ${result.emailError}`, { duration: 10000 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStaff = async (values: z.infer<typeof editStaffSchema>) => {
    if (!editStaff) return;
    setSubmitting(true);
    try {
      await updateStaffMember(editStaff.id, {
        displayName: values.displayName,
        staffUsername: values.staffUsername?.trim() || undefined,
        courseIds: values.courseIds ?? [],
        certified: values.certified,
      });
      refresh();
      setEditStaff(null);
      toast.success("Staff member updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdmin = async (values: z.infer<typeof adminSchema>) => {
    setSubmitting(true);
    try {
      const result = await addAdmin({
        displayName: values.displayName,
        email: values.email,
        password: values.password?.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
      setAdminOpen(false);
      adminForm.reset();
      toast.success("Admin account created");
      if (result.tempPassword) {
        toast.info(`Temporary password: ${result.tempPassword}`, { duration: 12000 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContent = async (values: z.infer<typeof contentSchema>) => {
    setSubmitting(true);
    try {
      const result = await addContentManager(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
      setContentOpen(false);
      contentForm.reset();
      toast.success("Content team account created");
      if (result.tempPassword) {
        toast.info(`Temporary password: ${result.tempPassword}`, { duration: 12000 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add content team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPaperCenter = async (values: z.infer<typeof paperCenterSchema>) => {
    setSubmitting(true);
    try {
      const result = await addPaperCenterStaff({
        displayName: values.displayName,
        staffUsername: values.staffUsername,
        email: values.email,
        paperCenterId: values.paperCenterId,
        password: values.password?.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
      setPaperCenterOpen(false);
      paperCenterForm.reset();
      toast.success("Paper center staff account created");
      if (result.loginUrl) {
        toast.info(`Login URL: ${result.loginUrl}`, { duration: 15000 });
      }
      if (result.tempPassword) {
        toast.info(`Temporary password: ${result.tempPassword}`, { duration: 12000 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add paper center staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry: PeopleRosterEntry) => {
    const label =
      entry.role === "admin"
        ? "administrator"
        : entry.role === "content_manager"
          ? "content team member"
          : entry.role === "paper_center_staff"
            ? "paper center staff member"
            : "staff member";
    if (!confirm(`Remove this ${label}?`)) return;
    try {
      if (entry.role === "teacher") await deleteStaffMember(entry.id);
      else if (entry.role === "admin") await deleteAdmin(entry.userId);
      else if (entry.role === "super_admin") {
        toast.error("Super administrators cannot be removed from this screen");
        return;
      }
      else if (entry.role === "content_manager") {
        await deleteContentManager(entry.id);
      } else if (entry.role === "paper_center_staff") {
        await deletePaperCenterStaff(entry.id);
      }
      refresh();
      toast.success("Account removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleToggleActive = async (entry: PeopleRosterEntry) => {
    try {
      if (entry.role === "teacher") {
        await setStaffMemberActive(entry.id, !entry.active);
      } else if (entry.role === "content_manager") {
        await setContentManagerActive(entry.id, !entry.active);
      } else if (entry.role === "paper_center_staff") {
        await setPaperCenterStaffActive(entry.id, !entry.active);
      } else {
        return;
      }
      refresh();
      toast.success(entry.active ? "Account deactivated" : "Account activated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleResetPassword = async (entry: PeopleRosterEntry) => {
    try {
      if (entry.role === "teacher") {
        const result = await resetStaffPassword(entry.id);
        toast.success(result.emailSent ? "Password reset — emailed to staff" : "Password reset");
        if (result.tempPassword) {
          toast.info(`New password for ${result.email}: ${result.tempPassword}`, { duration: 12000 });
        }
        if (!result.emailSent && result.emailError) {
          toast.warning(`Email not sent: ${result.emailError}`, { duration: 10000 });
        }
      } else if (entry.role === "admin") {
        const result = await resetAdminPassword(entry.userId);
        toast.success("Password reset");
        if (result.tempPassword) {
          toast.info(`New password for ${result.email}: ${result.tempPassword}`, { duration: 12000 });
        }
      } else if (entry.role === "content_manager") {
        const result = await resetContentManagerPassword(entry.id);
        toast.success("Password reset");
        if (result.tempPassword) {
          toast.info(`New password for ${result.email}: ${result.tempPassword}`, { duration: 12000 });
        }
      } else if (entry.role === "paper_center_staff") {
        const result = await resetPaperCenterStaffPassword(entry.id);
        toast.success("Password reset");
        if (result.tempPassword) {
          toast.info(`New password for ${result.email}: ${result.tempPassword}`, { duration: 12000 });
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Password reset failed");
    }
  };

  const handlePromote = async (entry: PeopleRosterEntry) => {
    if (!confirm(`Promote ${entry.displayName} to administrator?`)) return;
    try {
      await promoteTeacherToAdmin(entry.id);
      refresh();
      toast.success("Promoted to admin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Promotion failed");
    }
  };

  const handleDemote = async (entry: PeopleRosterEntry) => {
    if (!confirm(`Demote ${entry.displayName} to staff?`)) return;
    try {
      await demoteAdminToTeacher(entry.userId);
      refresh();
      toast.success("Demoted to staff");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Demotion failed");
    }
  };

  const emptyStateCopy = () => {
    if (tab === "admins") {
      return {
        icon: ShieldCheck,
        title: "No administrators yet",
        description: createAdmins
          ? "Create administrator accounts for the admin portal"
          : "Only super administrators can add admin accounts",
      };
    }
    if (tab === "content") {
      return {
        icon: Clapperboard,
        title: "No content team accounts yet",
        description: "Add content managers for social tracking and publishing",
      };
    }
    if (tab === "paperCenter") {
      return {
        icon: FileText,
        title: "No paper center staff yet",
        description: "Create accounts for paper center staff to upload student exam papers",
      };
    }
    if (tab === "staff") {
      return {
        icon: Users,
        title: "No staff accounts yet",
        description: "Add staff members to grant portal access",
      };
    }
    return {
      icon: Users,
      title: "No accounts yet",
      description: "Add staff members to grant portal access",
    };
  };

  const actionButton = () => {
    if (tab === "admins") {
      if (!createAdmins) return null;
      return (
        <Button onClick={() => setAdminOpen(true)}>
          <Plus className="mr-2 size-4" /> Add Admin
        </Button>
      );
    }
    if (tab === "content") {
      return (
        <Button onClick={() => setContentOpen(true)}>
          <Plus className="mr-2 size-4" /> Add Content Member
        </Button>
      );
    }
    if (tab === "paperCenter") {
      if (!manageAdmins) return null;
      return (
        <Button onClick={() => setPaperCenterOpen(true)}>
          <Plus className="mr-2 size-4" /> Add Paper Center Staff
        </Button>
      );
    }
    return (
      <Button onClick={() => setStaffOpen(true)}>
        <Plus className="mr-2 size-4" /> Add Staff
      </Button>
    );
  };

  const columns = [
    { key: "displayName" as const, label: "Name" },
    { key: "staffUsername" as const, label: "Staff username", render: (row: PeopleRosterEntry) => row.staffUsername ?? "—" },
    { key: "email" as const, label: "Email" },
    {
      key: "paperCenterName" as const,
      label: "Paper center",
      render: (row: PeopleRosterEntry) => row.paperCenterName ?? "—",
    },
    {
      key: "role" as const,
      label: "Role",
      render: (row: PeopleRosterEntry) => roleBadge(row.role),
    },
    {
      key: "active" as const,
      label: "Status",
      render: (row: PeopleRosterEntry) => (
        <Badge
          variant={row.active ? "default" : "outline"}
          className={row.active ? "bg-icvf-accent" : "border-input text-muted-foreground"}
        >
          {row.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "id" as const,
      label: "Actions",
      render: (row: PeopleRosterEntry) => (
        <div className="flex flex-wrap gap-2">
          {row.role === "teacher" && (
            <Button type="button" variant="outline" size="sm" onClick={() => openEditStaff(row)}>
              <Pencil className="mr-1 size-3.5" /> Edit
            </Button>
          )}
          {row.role !== "admin" && row.role !== "super_admin" && (
            <Button type="button" variant="outline" size="sm" onClick={() => void handleToggleActive(row)}>
              {row.active ? "Deactivate" : "Activate"}
            </Button>
          )}
          {row.role === "teacher" && manageAdmins && (
            <Button type="button" variant="outline" size="sm" onClick={() => void handlePromote(row)}>
              <ShieldCheck className="mr-1 size-3.5" /> Promote
            </Button>
          )}
          {row.role === "admin" && manageAdmins && (
            <Button type="button" variant="outline" size="sm" onClick={() => void handleDemote(row)}>
              Demote
            </Button>
          )}
          {(row.role === "teacher" ||
            row.role === "admin" ||
            row.role === "content_manager" ||
            row.role === "paper_center_staff") && (
            <Button type="button" variant="outline" size="sm" onClick={() => void handleResetPassword(row)}>
              <KeyRound className="mr-1 size-3.5" /> Reset
            </Button>
          )}
        </div>
      ),
    },
  ];

  const emptyCopy = emptyStateCopy();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="People"
        description="Manage staff, administrators, content team, and paper center accounts"
        action={tab === "all" ? undefined : actionButton()}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as PeopleTab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="content">Content Team</TabsTrigger>
          {manageAdmins && <TabsTrigger value="paperCenter">Paper Center</TabsTrigger>}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading roster…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={emptyCopy.icon}
              title={emptyCopy.title}
              description={emptyCopy.description}
              action={actionButton()}
            />
          ) : (
            <AdminTable columns={columns} data={filtered} onDelete={(id) => {
              const entry = filtered.find((e) => e.id === id);
              if (entry) void handleDelete(entry);
            }} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <Form {...staffForm}>
            <form onSubmit={staffForm.handleSubmit(handleAddStaff)} className="flex flex-col gap-4">
              <FormField control={staffForm.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={staffForm.control} name="staffUsername" render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff username</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. vithoosan" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={staffForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <p className="text-xs text-muted-foreground">
                    Must be unique. Do not use an existing admin login email (e.g. admin@ictf.lk).
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={staffForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate and email to staff.</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={staffForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={staffForm.control} name="courseIds" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned courses</FormLabel>
                  <FormControl>
                    <CourseCheckboxes value={field.value ?? []} onChange={field.onChange} courses={courses} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating…</> : "Create Staff"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editStaff} onOpenChange={(open) => !open && setEditStaff(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditStaff)} className="flex flex-col gap-4">
              <FormField control={editForm.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="staffUsername" render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff username</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. tharani" /></FormControl>
                  <p className="text-xs text-muted-foreground">
                    Used on the staff login page. Leave blank to keep the current value.
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="courseIds" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned courses</FormLabel>
                  <FormControl>
                    <CourseCheckboxes value={field.value ?? []} onChange={field.onChange} courses={courses} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={editForm.control} name="certified" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Certified staff</FormLabel>
                </FormItem>
              )} />
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Saving…</> : "Save Changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
          </DialogHeader>
          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit(handleAddAdmin)} className="flex flex-col gap-4">
              <FormField control={adminForm.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={adminForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={adminForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate a temporary password.</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={adminForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating…</> : "Create Admin"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={contentOpen} onOpenChange={setContentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Content Team Member</DialogTitle>
          </DialogHeader>
          <Form {...contentForm}>
            <form onSubmit={contentForm.handleSubmit(handleAddContent)} className="flex flex-col gap-4">
              <FormField control={contentForm.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={contentForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating…</> : "Create Account"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={paperCenterOpen} onOpenChange={setPaperCenterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Paper Center Staff</DialogTitle>
          </DialogHeader>
          <Form {...paperCenterForm}>
            <form onSubmit={paperCenterForm.handleSubmit(handleAddPaperCenter)} className="flex flex-col gap-4">
              <FormField control={paperCenterForm.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabel>Staff name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={paperCenterForm.control} name="staffUsername" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. jaffna_center" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={paperCenterForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={paperCenterForm.control} name="paperCenterId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Paper center</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select center" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paperCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={paperCenterForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate a temporary password.</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={paperCenterForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating…</> : "Create Account"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPeoplePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <PeoplePageContent />
    </Suspense>
  );
}
