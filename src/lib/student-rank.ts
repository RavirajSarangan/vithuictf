/** Default rank for new students before leaderboard placement. */
export const PLACEHOLDER_STUDENT_RANK = 50;

export function hasAssignedRank(rank: number | null | undefined): rank is number {
  return typeof rank === "number" && rank > 0 && rank !== PLACEHOLDER_STUDENT_RANK;
}

export function formatStudentRank(rank: number | null | undefined): string | null {
  return hasAssignedRank(rank) ? `#${rank}` : null;
}
