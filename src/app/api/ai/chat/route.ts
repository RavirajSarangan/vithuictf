import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import { getMockStudyAssistantResponse } from "@/lib/ai/mock-responses";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    query?: string;
    studentContext?: { displayName: string; courseName: string; grade: string };
  };

  const query = body.query?.trim();
  if (!query) {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = body.studentContext;
  const system = `You are the ${BRAND.name} AI study assistant for ICT students in Sri Lanka.
Be concise, encouraging, and syllabus-focused. Student: ${ctx?.displayName ?? "Student"}, course: ${ctx?.courseName ?? "ICT"}, grade: ${ctx?.grade ?? "—"}.`;

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
      displayName: ctx?.displayName ?? "Student",
      courseName: ctx?.courseName ?? "ICT",
      grade: ctx?.grade ?? "B",
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
