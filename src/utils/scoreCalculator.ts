/**
 * Score calculation algorithm for MusicFight.
 * Max score = 100 points per question.
 * Time per track = 10 seconds.
 * Grace period = 1.5 seconds (allows buffer/audio startup time).
 * After grace period, score decreases linearly by 10 points per second.
 */

export function calculateQuestionScore(elapsedTimeSeconds: number): {
  basePoints: number;
  finalPoints: number;
} {
  const t = Math.max(0, Math.min(10, elapsedTimeSeconds));
  const gracePeriod = 1.5; // 1.5 seconds grace period before score decreases

  let points = 100;
  if (t > gracePeriod) {
    const elapsedAfterGrace = t - gracePeriod;
    points = Math.round(100 - elapsedAfterGrace * 10);
  }

  // Minimum 10 points if answered within 10 seconds
  const finalPoints = Math.max(10, Math.min(100, points));

  return {
    basePoints: finalPoints,
    finalPoints
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
