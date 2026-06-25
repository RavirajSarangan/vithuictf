"use client";

import { useState } from "react";
import { useStudentData } from "@/hooks/use-data";
import {
  getMockExamPrediction,
  getMockWeakAreaAnalysis,
  getMockStudyPlanner,
} from "@/lib/ai/mock-responses";
import { GlassCard } from "@/components/shared/glass-card";
import {
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Loader2, Send, Sparkles } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function AiAssistantPage() {
  const student = useStudentData();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [source, setSource] = useState<"ai" | "mock">("mock");
  const [loading, setLoading] = useState(false);

  const ask = async (q: string) => {
    if (!student || !q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          studentContext: {
            displayName: student.displayName,
            courseName: student.courseName,
            grade: student.grade,
          },
        }),
      });
      const data = (await res.json()) as { text?: string; source?: "ai" | "mock" };
      setResponse(data.text ?? "No response");
      setSource(data.source ?? "mock");
    } catch {
      setResponse("Could not reach the study assistant. Please try again.");
      setSource("mock");
    } finally {
      setLoading(false);
    }
  };

  if (student === undefined) {
    return <StudentPageLoading rows={2} />;
  }

  if (!student) {
    return null;
  }

  const tabs = [
    { id: "assistant", label: "Study Assistant", content: response || "Ask me anything about your studies!" },
    { id: "prediction", label: "Exam Prediction", content: getMockExamPrediction(student) },
    { id: "weak", label: "Weak Areas", content: getMockWeakAreaAnalysis(student) },
    { id: "planner", label: "Study Planner", content: getMockStudyPlanner(student) },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="AI Assistant"
        description="Get study help, exam tips, and planning guidance for your ICT program."
      />

      <GlassCard className="bg-gradient-to-r from-icvf-navy to-icvf-navy-dark text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Brain className="size-10 shrink-0 text-icvf-accent" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{BRAND.name} Study Assistant</h2>
              <Badge variant="outline" className="border-icvf-accent/40 text-icvf-accent">
                {source === "ai" ? "AI powered" : "Offline mode"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-white/70">
              {source === "ai"
                ? "Answers use your course context when the AI gateway is available."
                : "Showing guided study tips while AI is unavailable."}
            </p>
          </div>
          <Sparkles className="hidden size-6 shrink-0 text-icvf-accent sm:block" />
        </div>
      </GlassCard>

      <Tabs defaultValue="assistant">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-icvf-surface p-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="rounded-lg">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="assistant">
          <GlassCard>
            <InputGroup>
              <InputGroupInput
                placeholder="Ask about your studies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void ask(query)}
                className="min-h-11"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton onClick={() => void ask(query)} disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-icvf-text-light">
              {loading ? <Skeleton className="h-20 w-full rounded-xl" /> : tabs[0].content}
            </div>
          </GlassCard>
        </TabsContent>

        {tabs.slice(1).map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <GlassCard>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-icvf-text-light">
                {t.content}
              </div>
            </GlassCard>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
