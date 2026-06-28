"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateSessionTimes } from "@/lib/actions/academics";
import type { ClassSession, ClassSessionStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SESSION_STATUS_LABELS } from "@/lib/academics/constants";

const sessionSchema = z.object({
  scheduledDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface SessionEditDialogProps {
  session: ClassSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function SessionEditDialog({ session, open, onOpenChange, onSaved }: SessionEditDialogProps) {
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      scheduledDate: "",
      startTime: "09:00",
      endTime: "12:00",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (open && session) {
      form.reset({
        scheduledDate: session.scheduledDate,
        startTime: session.startTime.slice(0, 5),
        endTime: session.endTime.slice(0, 5),
        status: session.status,
      });
    }
  }, [open, session, form]);

  const onSubmit = async (values: SessionFormValues) => {
    if (!session) return;
    try {
      await updateSessionTimes(session.id, values);
      onSaved();
      onOpenChange(false);
      toast.success("Session updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit session {session ? `#${session.sessionNumber}` : ""}</DialogTitle>
        </DialogHeader>
        {session && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["scheduled", "completed", "cancelled"] as ClassSessionStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {SESSION_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save session"
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
