import type { DraftQuestion } from "@/components/academics/exams/draft-question-builder";

/**
 * Parses a fixed plain-text format for bulk MCQ entry — no AI/OCR, pure
 * string parsing. Expected shape (blank-line-separated blocks):
 *
 *   Q: What is 2+2?
 *   1. 3
 *   2. 4*
 *   3. 5
 *   4. 6
 *
 * The `*` suffix on an option line marks it correct. Blocks that don't
 * resolve to a prompt + exactly 4 options are skipped, not hard-failed.
 */
export function parsePastedQuestions(text: string): { questions: DraftQuestion[]; skipped: number } {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const questions: DraftQuestion[] = [];
  let skipped = 0;

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 5) {
      skipped += 1;
      continue;
    }

    const promptLine = lines[0].replace(/^Q:\s*/i, "").trim();
    const optionLines = lines.slice(1, 5);

    if (!promptLine || optionLines.length !== 4) {
      skipped += 1;
      continue;
    }

    let correctIndex = 0;
    let foundCorrect = false;
    const options = optionLines.map((line, index) => {
      const withoutPrefix = line.replace(/^\d+[.)]\s*/, "");
      const isCorrect = /\*\s*$/.test(withoutPrefix);
      if (isCorrect) {
        correctIndex = index;
        foundCorrect = true;
      }
      return withoutPrefix.replace(/\*\s*$/, "").trim();
    });

    if (options.some((o) => !o)) {
      skipped += 1;
      continue;
    }

    questions.push({
      prompt: promptLine,
      options,
      correctIndex: foundCorrect ? correctIndex : 0,
      points: 1,
    });
  }

  return { questions, skipped };
}
