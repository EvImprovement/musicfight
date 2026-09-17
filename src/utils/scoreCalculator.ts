/**
 * Score calculation algorithm for MusicFight.
 * Max score = 100 points per question.
 * Time per track = 10 seconds.
 * Grace period = 1.5 seconds (full 100 pts while audio starts).
 * Between 1.5s and 10.0s, score decreases linearly down to 0 pts at 10.0s.
 */

export function calculateQuestionScore(elapsedTimeSeconds: number): {
  basePoints: number;
  finalPoints: number;
} {
  const t = Math.max(0, Math.min(10, elapsedTimeSeconds));
  const gracePeriod = 1.5;
  const totalTime = 10.0;

  if (t <= gracePeriod) {
    return { basePoints: 100, finalPoints: 100 };
  }

  if (t >= totalTime) {
    return { basePoints: 0, finalPoints: 0 };
  }

  // Linear decay from 100 to 0 over 8.5 seconds
  const remainingTimeWindow = totalTime - gracePeriod; // 8.5s
  const elapsedInWindow = t - gracePeriod;
  const ratio = 1 - (elapsedInWindow / remainingTimeWindow);
  const points = Math.max(0, Math.min(100, Math.round(100 * ratio)));

  return {
    basePoints: points,
    finalPoints: points
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
