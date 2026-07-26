"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { getSessionProfile, requireAcademicsStaff, requireFeatureAccess } from "@/lib/actions/auth";
import { actionFailure, type ActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { mapQuiz, mapQuizAttempt, mapQuizQuestion } from "@/lib/supabase/mappers";
import type { Quiz, QuizAttempt, QuizQuestion } from "@/types";

function revalidateQuizPaths() {
  safeRevalidatePath("/academics/quizzes");
  safeRevalidatePath("/quizzes");
}

function validateQuestionInput(input: {
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
}): string | null {
  if (input.prompt.trim().length < 3) return "Question prompt must be at least 3 characters";
  if (input.options.length !== 4) return "Provide exactly 4 answer options";
  const options = input.options.map((o) => o.trim());
  if (options.some((o) => !o)) return "All 4 answer options are required";
  if (input.correctIndex < 0 || input.correctIndex >= options.length) {
    return "Mark one of the options as correct";
  }
  if (!Number.isFinite(input.points) || input.points < 1 || input.points > 100) {
    return "Points must be between 1 and 100";
  }
  return null;
}

export async function getStaffQuizzes(): Promise<Quiz[]> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("quizzes")
    .select("*, courses(name), course_batches(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const quizzes = (rows ?? []).map(mapQuiz);
  if (!quizzes.length) return quizzes;

  const ids = quizzes.map((q) => q.id);
  const [{ data: questionRows }, { data: attemptRows }] = await Promise.all([
    supabase.from("quiz_questions").select("quiz_id, points").in("quiz_id", ids),
    supabase.from("quiz_attempts").select("quiz_id").in("quiz_id", ids),
  ]);

  const questionCounts = new Map<string, { count: number; points: number }>();
  for (const row of questionRows ?? []) {
    const entry = questionCounts.get(row.quiz_id) ?? { count: 0, points: 0 };
    entry.count += 1;
    entry.points += row.points;
    questionCounts.set(row.quiz_id, entry);
  }
  const attemptCounts = new Map<string, number>();
  for (const row of attemptRows ?? []) {
    attemptCounts.set(row.quiz_id, (attemptCounts.get(row.quiz_id) ?? 0) + 1);
  }

  return quizzes.map((quiz) => ({
    ...quiz,
    questionCount: questionCounts.get(quiz.id)?.count ?? 0,
    totalPoints: questionCounts.get(quiz.id)?.points ?? 0,
    attemptCount: attemptCounts.get(quiz.id) ?? 0,
  }));
}

export async function getQuizEditor(quizId: string): Promise<{
  quiz: Quiz;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
}> {
  await requireAcademicsStaff();
  const supabase = await createClient();

  const { data: quizRow, error } = await supabase
    .from("quizzes")
    .select("*, courses(name), course_batches(name)")
    .eq("id", quizId)
    .single();
  if (error || !quizRow) throw new Error(error?.message ?? "Quiz not found");

  const [{ data: questionRows }, { data: attemptRows }] = await Promise.all([
    supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("position", { ascending: true }),
    supabase
      .from("quiz_attempts")
      .select("*, students(display_name, student_id)")
      .eq("quiz_id", quizId)
      .order("completed_at", { ascending: false })
      .limit(200),
  ]);

  return {
    quiz: mapQuiz(quizRow),
    questions: (questionRows ?? []).map((row) => mapQuizQuestion(row)),
    attempts: (attemptRows ?? []).map(mapQuizAttempt),
  };
}

export async function createQuiz(data: {
  courseId: string;
  batchId?: string | null;
  title: string;
  description: string;
  timeLimitMinutes?: number | null;
  maxAttempts: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const profile = await requireFeatureAccess("quizzes_exams");
    const supabase = await createClient();

    if (!data.courseId) return { ok: false, error: "Course is required" };
    if (data.title.trim().length < 3) return { ok: false, error: "Title must be at least 3 characters" };

    const { data: created, error } = await supabase
      .from("quizzes")
      .insert({
        course_id: data.courseId,
        batch_id: data.batchId ?? null,
        title: data.title.trim(),
        description: data.description.trim(),
        time_limit_minutes: data.timeLimitMinutes ?? null,
        max_attempts: Math.max(0, Math.round(data.maxAttempts)),
        published: false,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error || !created) return actionFailure(error, "Failed to create quiz");

    revalidateQuizPaths();
    return { ok: true, id: created.id };
  } catch (error) {
    return actionFailure(error, "Failed to create quiz");
  }
}

export async function updateQuiz(
  quizId: string,
  data: {
    title: string;
    description: string;
    timeLimitMinutes?: number | null;
    maxAttempts: number;
    published: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    if (data.title.trim().length < 3) return { ok: false, error: "Title must be at least 3 characters" };

    if (data.published) {
      const { count } = await supabase
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quizId);
      if (!count) return { ok: false, error: "Add at least one question before publishing" };
    }

    const { error } = await supabase
      .from("quizzes")
      .update({
        title: data.title.trim(),
        description: data.description.trim(),
        time_limit_minutes: data.timeLimitMinutes ?? null,
        max_attempts: Math.max(0, Math.round(data.maxAttempts)),
        published: data.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quizId);
    if (error) return actionFailure(error, "Failed to update quiz");

    revalidateQuizPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update quiz");
  }
}

export async function deleteQuiz(quizId: string): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
    if (error) return actionFailure(error, "Failed to delete quiz");

    revalidateQuizPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete quiz");
  }
}

export async function saveQuizQuestion(input: {
  id?: string;
  quizId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
  position?: number;
}): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const invalid = validateQuestionInput(input);
    if (invalid) return { ok: false, error: invalid };
    const options = input.options.map((o) => o.trim()).filter(Boolean);

    if (input.id) {
      const { error } = await supabase
        .from("quiz_questions")
        .update({
          prompt: input.prompt.trim(),
          options,
          correct_index: input.correctIndex,
          points: Math.round(input.points),
        })
        .eq("id", input.id);
      if (error) return actionFailure(error, "Failed to update question");
    } else {
      let position = input.position;
      if (position === undefined) {
        const { data: maxRow } = await supabase
          .from("quiz_questions")
          .select("position")
          .eq("quiz_id", input.quizId)
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle();
        position = (maxRow?.position ?? 0) + 1;
      }
      const { error } = await supabase.from("quiz_questions").insert({
        quiz_id: input.quizId,
        prompt: input.prompt.trim(),
        options,
        correct_index: input.correctIndex,
        points: Math.round(input.points),
        position,
      });
      if (error) return actionFailure(error, "Failed to add question");
    }

    revalidateQuizPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to save question");
  }
}

export async function deleteQuizQuestion(questionId: string): Promise<ActionResult> {
  try {
    await requireAcademicsStaff();
    const supabase = await createClient();

    const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
    if (error) return actionFailure(error, "Failed to delete question");

    revalidateQuizPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete question");
  }
}

async function getStudentContext(): Promise<
  { ok: true; studentId: string; displayName: string } | { ok: false; error: string }
> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "student") {
    return { ok: false, error: "Only students can take quizzes" };
  }
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, display_name")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!student) return { ok: false, error: "No student profile linked to this account" };
  return { ok: true, studentId: student.id, displayName: student.display_name };
}

export async function getQuizForTaking(quizId: string): Promise<
  | { ok: true; quiz: Quiz; questions: QuizQuestion[]; attemptsUsed: number }
  | { ok: false; error: string }
> {
  try {
    const student = await getStudentContext();
    if (!student.ok) return student;

    const supabase = await createClient();
    // RLS restricts to published quizzes in the student's courses/batches.
    const { data: quizRow } = await supabase
      .from("quizzes")
      .select("*, courses(name), course_batches(name)")
      .eq("id", quizId)
      .maybeSingle();
    if (!quizRow) return { ok: false, error: "Quiz not found or not available" };

    const { count: attemptsUsed } = await supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId)
      .eq("student_id", student.studentId);

    if (quizRow.max_attempts > 0 && (attemptsUsed ?? 0) >= quizRow.max_attempts) {
      return { ok: false, error: "You have used all attempts for this quiz" };
    }

    if (!isAdminClientConfigured()) return { ok: false, error: "Quiz service not configured" };
    const admin = createAdminClient();
    const { data: questionRows, error } = await admin
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("position", { ascending: true });
    if (error) return actionFailure(error, "Failed to load questions");
    if (!questionRows?.length) return { ok: false, error: "This quiz has no questions yet" };

    return {
      ok: true,
      quiz: mapQuiz(quizRow),
      questions: questionRows.map((row) => mapQuizQuestion(row, { includeAnswer: false })),
      attemptsUsed: attemptsUsed ?? 0,
    };
  } catch (error) {
    return actionFailure(error, "Failed to load quiz");
  }
}

export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, number>
): Promise<
  | {
      ok: true;
      score: number;
      maxScore: number;
      results: { questionId: string; correctIndex: number; chosenIndex: number | null; correct: boolean }[];
    }
  | { ok: false; error: string }
> {
  try {
    const student = await getStudentContext();
    if (!student.ok) return student;

    const supabase = await createClient();
    const { data: quizRow } = await supabase
      .from("quizzes")
      .select("id, course_id, title, max_attempts")
      .eq("id", quizId)
      .maybeSingle();
    if (!quizRow) return { ok: false, error: "Quiz not found or not available" };

    if (!isAdminClientConfigured()) return { ok: false, error: "Quiz service not configured" };
    const admin = createAdminClient();

    const { count: attemptsUsed } = await admin
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId)
      .eq("student_id", student.studentId);
    if (quizRow.max_attempts > 0 && (attemptsUsed ?? 0) >= quizRow.max_attempts) {
      return { ok: false, error: "You have used all attempts for this quiz" };
    }

    const { data: questionRows, error: questionsError } = await admin
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId);
    if (questionsError || !questionRows?.length) {
      return actionFailure(questionsError, "Failed to load questions");
    }

    let score = 0;
    let maxScore = 0;
    const results = questionRows.map((question) => {
      maxScore += question.points;
      const chosen = answers[question.id];
      const chosenIndex = Number.isInteger(chosen) ? (chosen as number) : null;
      const correct = chosenIndex !== null && chosenIndex === question.correct_index;
      if (correct) score += question.points;
      return {
        questionId: question.id,
        correctIndex: question.correct_index,
        chosenIndex,
        correct,
      };
    });

    const { error: insertError } = await admin.from("quiz_attempts").insert({
      quiz_id: quizId,
      student_id: student.studentId,
      answers,
      score,
      max_score: maxScore,
    });
    if (insertError) return actionFailure(insertError, "Failed to save attempt");

    // First completion earns leaderboard points; retakes don't stack.
    if ((attemptsUsed ?? 0) === 0 && score > 0) {
      const { data: entry } = await admin
        .from("leaderboard")
        .select("id, points")
        .eq("student_id", student.studentId)
        .eq("course_id", quizRow.course_id)
        .maybeSingle();
      if (entry) {
        await admin
          .from("leaderboard")
          .update({ points: entry.points + score })
          .eq("id", entry.id);
      } else {
        await admin.from("leaderboard").insert({
          student_id: student.studentId,
          course_id: quizRow.course_id,
          student_name: student.displayName,
          points: score,
        });
      }
      await admin.from("activities").insert({
        student_id: student.studentId,
        title: `Completed quiz — ${quizRow.title}`,
        description: `Scored ${score}/${maxScore}`,
        activity_type: "quiz",
      });
    }

    revalidateQuizPaths();
    return { ok: true, score, maxScore, results };
  } catch (error) {
    return actionFailure(error, "Failed to submit quiz");
  }
}
