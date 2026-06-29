import { generateText } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import { getMockStudyAssistantResponse } from "@/lib/ai/mock-responses";

export const runtime = "nodejs";

const chatBodySchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(2000, "Query is too long"),
});

import { checkRateLimit } from "@/lib/security/rate-limit";

// Clip free-text fields before interpolating into the system prompt to limit the
// blast radius of any unexpected content.
function clip(value: string | null | undefined, max: number): string {
  return (value ?? "").replace(/[\r\n]+/g, " ").slice(0, max).trim();
}

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = chatBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const { query } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit(`ai-chat:${user.id}`, 20, 60);
  if (!allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  // Derive student context server-side
  const { data: student } = await supabase
    .from("students")
    .select("display_name, course_name, grade")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName = clip(student?.display_name, 100) || "Student";
  const courseName = clip(student?.course_name, 100) || "ICT";
  const grade = clip(student?.grade, 20) || "—";

  const system = `You are the ${BRAND.name} AI study assistant for ICT students in Sri Lanka.
Be concise, encouraging, and syllabus-focused. Student: ${displayName}, course: ${courseName}, grade: ${grade}.`;

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system,
      prompt: query,
    });
    return Response.json({ text, source: "ai" });
  } catch {
    const fallback = getMockStudyAssistantResponse(query, {
      id: user.id,
      displayName,
      courseName,
      grade,
      email: "",
      userId: user.id,
      studentId: "",
      courseId: "",
      rank: 0,
      streak: 0,
      points: 0,
      performance: 0,
    });
    return Response.json({ text: fallback, source: "mock" });
  }
}
