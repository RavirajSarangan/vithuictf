"use client";

import { useState } from "react";
import { parsePastedQuestions } from "@/lib/exams/parse-pasted-questions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, ClipboardPaste, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type DraftQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
};

export function emptyDraftQuestion(): DraftQuestion {
  return { prompt: "", options: ["", "", "", ""], correctIndex: 0, points: 1 };
}

/**
 * Local-state-only question builder for the "build questions here" online-exam
 * flow — nothing is persisted until the whole exam form is submitted (avoids
 * orphaned quizzes/questions if the admin abandons the dialog mid-way).
 */
function DraftQuestionForm({
  question,
  onSave,
  onCancel,
}: {
  question: DraftQuestion;
  onSave: (question: DraftQuestion) => void;
  onCancel: () => void;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [options, setOptions] = useState<string[]>(question.options);
  const [correctIndex, setCorrectIndex] = useState(question.correctIndex);
  const [points, setPoints] = useState(String(question.points));

  function handleSave() {
    const trimmedOptions = options.map((o) => o.trim());
    if (prompt.trim().length < 3) return;
    if (trimmedOptions.some((o) => !o)) return;
    onSave({
      prompt: prompt.trim(),
      options: trimmedOptions,
      correctIndex,
      points: Number(points) || 1,
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
      <div className="grid gap-2">
        <Label>Question</Label>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} />
      </div>
      <div className="grid gap-2">
        <Label>Options — tick the correct one</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCorrectIndex(index)}
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                correctIndex === index
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-muted-foreground/30 text-muted-foreground hover:border-emerald-400"
              }`}
              aria-label={`Mark option ${index + 1} correct`}
            >
              {index + 1}
            </button>
            <Input
              value={option}
              onChange={(e) => {
                const next = [...options];
                next[index] = e.target.value;
                setOptions(next);
              }}
              placeholder={`Option ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="grid w-28 gap-2">
          <Label>Points</Label>
          <Input type="number" min={1} max={100} value={points} onChange={(e) => setPoints(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save question
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DraftQuestionBuilder({
  questions,
  onChange,
}: {
  questions: DraftQuestion[];
  onChange: (questions: DraftQuestion[]) => void;
}) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  function handleImport() {
    const { questions: parsed, skipped } = parsePastedQuestions(pasteText);
    if (parsed.length) {
      onChange([...questions, ...parsed]);
    }
    if (parsed.length && !skipped) {
      toast.success(`Imported ${parsed.length} question${parsed.length === 1 ? "" : "s"}`);
    } else if (parsed.length && skipped) {
      toast.warning(`Imported ${parsed.length}, skipped ${skipped} block${skipped === 1 ? "" : "s"} that didn't match the format`);
    } else {
      toast.error("No valid questions found — check the format and try again");
      return;
    }
    setPasteText("");
    setPasteOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">Questions ({questions.length})</p>
        {editing === null ? (
          <div className="flex gap-2">
            <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
              <DialogTrigger
                render={
                  <Button type="button" size="sm" variant="outline">
                    <ClipboardPaste className="size-3.5" />
                    Paste questions
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Paste questions</DialogTitle>
                  <DialogDescription>
                    One blank line between questions. Exactly 4 numbered options each; mark the
                    correct one with a trailing <code>*</code>.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                  placeholder={"Q: What is 2+2?\n1. 3\n2. 4*\n3. 5\n4. 6\n\nQ: Next question...\n1. ...\n2. ...\n3. ...\n4. ...*"}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPasteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleImport} disabled={!pasteText.trim()}>
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing("new")}>
              <Plus className="size-3.5" />
              Add question
            </Button>
          </div>
        ) : null}
      </div>

      {questions.map((question, index) =>
        editing === index ? (
          <DraftQuestionForm
            key={index}
            question={question}
            onSave={(updated) => {
              const next = [...questions];
              next[index] = updated;
              onChange(next);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={index} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {index + 1}. {question.prompt}
                </p>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {question.options.map((option, optionIndex) => (
                    <li
                      key={optionIndex}
                      className={`flex items-center gap-2 text-xs ${
                        optionIndex === question.correctIndex
                          ? "font-medium text-emerald-700"
                          : "text-muted-foreground"
                      }`}
                    >
                      {optionIndex === question.correctIndex ? (
                        <Check className="size-3 shrink-0" />
                      ) : (
                        <span className="size-3 shrink-0" />
                      )}
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant="outline">{question.points} pt{question.points === 1 ? "" : "s"}</Badge>
                <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(index)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onChange(questions.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        )
      )}

      {editing === "new" ? (
        <DraftQuestionForm
          question={emptyDraftQuestion()}
          onSave={(question) => {
            onChange([...questions, question]);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      {questions.length === 0 && editing === null ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          No questions yet — add the first one.
        </p>
      ) : null}
    </div>
  );
}
