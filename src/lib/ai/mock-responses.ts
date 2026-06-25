import type { Student } from "@/types";

export function getMockStudyAssistantResponse(query: string, student: Student): string {
  return `Based on your current performance (${student.performance}% overall), I recommend focusing on **Statistics** this week. Your recent Term Test showed room for improvement in probability distributions.

For "${query}", here's my suggestion:
1. Review Chapter 8 notes in the Resource Center
2. Complete 10 practice problems from the 2025 Past Paper
3. Watch the Integration Masterclass video (45 min)

You're on a ${student.streak}-day streak — keep it going!`;
}

export function getMockExamPrediction(student: Student): string {
  const predicted = Math.min(95, student.performance + 5);
  return `**Exam Prediction for ${student.displayName}**

Predicted Score: **${predicted}%** (Grade: ${student.grade})
Confidence: 82%

Strengths: Pure Maths, Applied Maths
Areas to improve: Statistics, Probability

Recommended revision hours: 12 hours/week before the next exam.`;
}

export function getMockWeakAreaAnalysis(student: Student): string {
  return `**Weak Area Analysis for ${student.displayName}**

1. **Statistics** — 72% average (below class avg of 78%)
   - Focus: Probability distributions, hypothesis testing
   
2. **Applied Maths** — 78% average
   - Focus: Vector applications, complex numbers

3. **Pure Maths** — 85% average ✓ (Strength)

Priority action: Spend 60% of study time on Statistics this week.`;
}

export function getMockStudyPlanner(student: Student): string {
  return `**Personalized Study Plan — Week of June 24**

| Day | Focus | Duration |
|-----|-------|----------|
| Mon | Statistics — Probability | 2 hrs |
| Tue | Pure Maths — Integration | 1.5 hrs |
| Wed | Past Paper Practice | 2 hrs |
| Thu | Applied Maths — Vectors | 1.5 hrs |
| Fri | Revision & Self-test | 2 hrs |
| Sat | Live Class + Notes review | 3 hrs |
| Sun | Rest / Light reading | 1 hr |

Total: 13 hours | Target streak: ${student.streak + 7} days`;
}

export function getMockRecommendations(student: Student): string {
  return `**Recommended for You**

📚 Differentiation Notes — matches your current syllabus
📝 2025 Past Paper — exam-style practice
🎥 Integration Masterclass — strengthen Applied Maths
📋 Assignment 5 - Vectors — due this week

Based on your ${student.points} points and rank #${student.rank}, you're on track for a top-10 finish this term!`;
}
