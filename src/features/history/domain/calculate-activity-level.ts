export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export function calculateActivityLevel(totalSeconds: number): ActivityLevel {
  if (totalSeconds <= 0) {
    return 0;
  }

  if (totalSeconds < 15 * 60) {
    return 1;
  }

  if (totalSeconds < 30 * 60) {
    return 2;
  }

  if (totalSeconds < 60 * 60) {
    return 3;
  }

  return 4;
}
