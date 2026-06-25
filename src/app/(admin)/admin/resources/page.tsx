"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addResource, deleteResource } from "@/lib/actions/admin";
import { useAdminCourses, useAdminResources } from "@/hooks/use-data";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import type { ResourceCategory } from "@/types";

const resourceSchema = z.object({
  title: z.string().min(2, "Title is required"),
  courseId: z.string().min(1, "Select a course"),
  category: z.enum(["notes", "past_papers", "videos", "assignments", "study_guides"]),
  description: z.string().optional(),
  type: z.enum(["pdf", "video"]),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

export default function AdminResourcesPage() {
  const { data, refresh } = useAdminResources();
  const { data: courses } = useAdminCourses();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      courseId: "",
      category: "notes",
      description: "",
      type: "pdf",
    },
  });

  const onSubmit = async (values: ResourceFormValues) => {
    const course = courses.find((c) => c.id === values.courseId);
    if (!course) {
      toast.error("Course not found");
      return;
    }

    setSubmitting(true);
    try {
      await addResource({
        title: values.title,
        courseId: course.id,
        courseName: course.name,
        category: values.category as ResourceCategory,
        description: values.description,
        type: values.type,
      });
      refresh();
      setOpen(false);
      form.reset();
      toast.success("Resource added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add resource");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id);
      refresh();
      toast.success("Resource deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resources"
        description="Manage study materials for student courses"
        action={
          <Button className="bg-icvf-accent hover:bg-icvf-accent-hover" onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" /> Add Resource
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources yet"
          description="Upload notes, past papers, and study guides"
          action={
            <Button className="bg-icvf-accent" onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> Add Resource
            </Button>
          }
          className="border-white/10 bg-white/5 text-white"
        />
      ) : (
        <AdminTable
          columns={[
            { key: "title", label: "Title" },
            { key: "category", label: "Category" },
            { key: "courseName", label: "Course" },
            { key: "type", label: "Type" },
            { key: "views", label: "Views" },
          ]}
          data={data}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Chapter 5 Notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="notes">Notes</SelectItem>
                          <SelectItem value="past_papers">Past Papers</SelectItem>
                          <SelectItem value="videos">Videos</SelectItem>
                          <SelectItem value="assignments">Assignments</SelectItem>
                          <SelectItem value="study_guides">Study Guides</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="bg-icvf-accent" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Resource"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
