"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addParent } from "@/lib/actions/parents";
import { useAdminStudents } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  studentIds: z.array(z.string()).min(1, "Select at least one student"),
});

type FormValues = z.infer<typeof schema>;

export function AddParentDialog({ onCreated }: { onCreated: () => void }) {
  const { data: students } = useAdminStudents();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "", studentIds: [] },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const result = await addParent({
        displayName: values.displayName,
        email: values.email,
        studentIds: values.studentIds,
        password: values.password || undefined,
      });
      toast.success(
        result.tempPassword
          ? `Parent created. Temp password: ${result.tempPassword}`
          : "Parent created and linked"
      );
      setOpen(false);
      form.reset();
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create parent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button className="bg-icvf-accent hover:bg-icvf-accent-hover" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" /> Add Parent
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create parent account</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Auto-generated if empty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Link students</FormLabel>
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
                      {students.map((s) => (
                        <FormField
                          key={s.id}
                          control={form.control}
                          name="studentIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes(s.id)}
                                  onCheckedChange={(checked) => {
                                    const next = checked
                                      ? [...field.value, s.id]
                                      : field.value.filter((id) => id !== s.id);
                                    field.onChange(next);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{s.displayName}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={submitting} className="w-full bg-icvf-accent hover:bg-icvf-accent-hover">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Create parent"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
