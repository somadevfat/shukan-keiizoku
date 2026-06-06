export type GoalComparison =
  | { readonly kind: "not-comparable" }
  | { readonly kind: "comparable"; readonly percentage: number };

export function calculateGoalComparison(
  yesterdaySeconds: number,
  goalSeconds: number,
): GoalComparison {
  if (yesterdaySeconds === 0) {
    return { kind: "not-comparable" };
  }

  const percentage =
    ((goalSeconds - yesterdaySeconds) / yesterdaySeconds) * 100;

  return {
    kind: "comparable",
    percentage: Math.round(percentage * 10) / 10,
  };
}
