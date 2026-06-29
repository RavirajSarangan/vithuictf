"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { clearSessionCanvaSlide, updateSessionCanvaSlide } from "@/lib/actions/academics";
import { isValidCanvaDesignUrl, toCanvaEmbedUrl } from "@/lib/canva/url";
import type { ClassSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const slideSchema = z.object({
  title: z.string().optional(),
  url: z
    .string()
    .min(1, "Canva URL is required")
    .refine((value) => isValidCanvaDesignUrl(value.trim()), {
      message: "Enter a valid Canva design link (https://www.canva.com/design/…/view)",
    }),
});

type SlideFormValues = z.infer<typeof slideSchema>;

interface SessionCanvaSlideDialogProps {
  session: ClassSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function SessionCanvaSlideDialog({
  session,
  open,
  onOpenChange,
  onSaved,
}: SessionCanvaSlideDialogProps) {
  const [clearing, setClearing] = useState(false);

  const form = useForm<SlideFormValues>({
    resolver: zodResolver(slideSchema),
    defaultValues: { title: "", url: "" },
  });

  useEffect(() => {
    if (open && session) {
      form.reset({
        title: session.canvaSlideTitle ?? "",
        url: session.canvaSlideUrl ?? "",
      });
    }
  }, [open, session, form]);

  const watchedUrl = form.watch("url");
  const previewEmbedUrl = useMemo(() => {
    const trimmed = watchedUrl.trim();
    if (!trimmed || !isValidCanvaDesignUrl(trimmed)) return null;
    return toCanvaEmbedUrl(trimmed);
  }, [watchedUrl]);

  const onSubmit = async (values: SlideFormValues) => {
    if (!session) return;
    try {
      await updateSessionCanvaSlide(session.id, {
        url: values.url.trim(),
        title: values.title?.trim(),
      });
      onSaved();
      onOpenChange(false);
      toast.success("Canva slides saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save slides");
    }
  };

  const handleClear = async () => {
    if (!session?.canvaSlideUrl) return;
    setClearing(true);
    try {
      await clearSessionCanvaSlide(session.id);
      onSaved();
      onOpenChange(false);
      toast.success("Slides removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove slides");
    } finally {
      setClearing(false);
    }
  };

  const defaultTitle = session ? `Class ${session.sessionNumber} slides` : "Class slides";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Canva slides{session ? ` — Class ${session.sessionNumber}` : ""}
          </DialogTitle>
        </DialogHeader>
        {session ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Paste a Canva design share link. The design must be shared publicly or embed-enabled in
                Canva for students to view it.
              </p>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder={defaultTitle} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canva URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.canva.com/design/…/view"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="min-h-0 flex-1 space-y-2">
                <p className="text-sm font-medium">Preview</p>
                {previewEmbedUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <iframe
                      src={previewEmbedUrl}
                      title="Canva slide preview"
                      className="absolute inset-0 size-full border-0"
                      allow="fullscreen"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground">
                    Enter a valid Canva design URL to preview
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                {session.canvaSlideUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={clearing || form.formState.isSubmitting}
                    onClick={() => void handleClear()}
                  >
                    {clearing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Remove slides
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Save slides
                </Button>
              </div>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
