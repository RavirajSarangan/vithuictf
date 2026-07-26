-- Part 1 reference paper: an optional, display-only PDF of the original MCQ
-- question paper (mirrors written_question_paper_path/name). Grading still
-- runs off the structured quiz_questions rows — this is purely for students
-- to see the paper's original formatting via the same protected viewer used
-- for Part 2.

ALTER TABLE public.exams
  ADD COLUMN mcq_question_paper_path TEXT,
  ADD COLUMN mcq_question_paper_name TEXT;
