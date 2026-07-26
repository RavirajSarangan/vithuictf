"use client";

import { useEffect, useRef, useState } from "react";
import {
  createPersonalNote,
  deletePersonalNote,
  updatePersonalNote,
  type PersonalNote,
} from "@/lib/actions/personal-notes";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { NotebookPen, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function NotesPanel({ notes, onChanged }: { notes: PersonalNote[]; onChanged: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  useEffect(() => {
    setTitle(selected?.title ?? "");
    setContent(selected?.content ?? "");
  }, [selected]);

  async function handleCreate() {
    setCreating(true);
    const formData = new FormData();
    formData.set("title", "Untitled note");
    formData.set("content", "");
    const result = await createPersonalNote(formData);
    setCreating(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChanged();
  }

  async function handleSave() {
    if (!selected) return;
    if (!title.trim()) {
      toast.error("Give the note a title");
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    const result = await updatePersonalNote(selected.id, formData);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Note saved");
    onChanged();
  }

  async function handleDelete(note: PersonalNote) {
    const result = await deletePersonalNote(note.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (selectedId === note.id) setSelectedId(null);
    toast.success("Note deleted");
    onChanged();
  }

  if (!notes.length) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No notes yet"
        description="Save a personal note — only you can see it."
        action={
          <Button type="button" onClick={() => void handleCreate()} disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            New note
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" onClick={() => void handleCreate()} disabled={creating}>
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          New note
        </Button>
        <div className="flex flex-col gap-1">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedId(note.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                note.id === selectedId
                  ? "border-icvf-accent bg-icvf-accent/5"
                  : "border-transparent hover:bg-muted/50"
              )}
            >
              <p className="truncate font-medium">{note.title}</p>
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="flex flex-col gap-3"
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note…"
            rows={12}
          />
          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => void handleDelete(selected)}>
              <Trash2 className="size-4" /> Delete
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Select a note to edit.</p>
      )}
    </div>
  );
}
