"use client";

import { useState } from "react";
import { deleteQuizQuestion, saveQuizQuestion } from "@/lib/actions/quizzes";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { QuizQuestion } from "@/types";

function QuestionForm({
  quizId,
  question,
  onDone,
  onCancel,
}: {
  quizId: string;
  question?: QuizQuestion;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [options, setOptions] = useState<string[]>(
    question?.options && question.options.length === 4 ? question.options : ["", "", "", ""]
  );
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? 0);
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (options.some((o) => !o.trim())) {
      toast.error("All 4 options are required");
      return;
    }
    setSaving(true);
    const result = await saveQuizQuestion({
      id: question?.id,
      quizId,
      prompt,
      options,
      correctIndex,
      points: Number(points) || 1,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(question ? "Question updated" : "Question added");
    onDone();
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
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save question
          </Button>
        </div>
      </div>
    </div>
  );
}

export function QuizQuestionsEditor({
  quizId,
  questions,
  onRefresh,
}: {
  quizId: string;
  questions: QuizQuestion[];
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  async function handleDeleteQuestion(questionId: string) {
    const result = await deleteQuizQuestion(questionId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onRefresh();
  }

  return (
    <GlassCard className="bg-white">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Questions ({questions.length})</h3>
        {editing === null ? (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            Add question
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((question, index) =>
          editing === question.id ? (
            <QuestionForm
              key={question.id}
              quizId={quizId}
              question={question}
              onDone={() => {
                setEditing(null);
                onRefresh();
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div key={question.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {index + 1}. {question.prompt}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {question.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className={`flex items-center gap-2 text-sm ${
                          optionIndex === question.correctIndex
                            ? "font-medium text-emerald-700"
                            : "text-muted-foreground"
                        }`}
                      >
                        {optionIndex === question.correctIndex ? (
                          <Check className="size-3.5 shrink-0" />
                        ) : (
                          <span className="size-3.5 shrink-0" />
                        )}
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline">{question.points} pt{question.points === 1 ? "" : "s"}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(question.id)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => void handleDeleteQuestion(question.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          )
        )}

        {editing === "new" ? (
          <QuestionForm
            quizId={quizId}
            onDone={() => {
              setEditing(null);
              onRefresh();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : null}

        {questions.length === 0 && editing === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No questions yet — add the first one to get started.
          </p>
        ) : null}
      </div>
    </GlassCard>
  );
}
