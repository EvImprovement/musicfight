/**
 * Score calculation algorithm for MusicFight (MeloClash style).
 * - Correct answer: Points decay linearly from 100 (instant) down to 50 (at 10s).
 * - Grace period = 0.75s (full 100 pts while audio starts).
 * - Wrong answer / Timeout: 0 point.
 */

export function calculateQuestionScore(elapsedTimeSeconds: number, isCorrect: boolean = true): {
  basePoints: number;
  finalPoints: number;
} {
  if (!isCorrect) {
    return { basePoints: 0, finalPoints: 0 };
  }

  const t = Math.max(0, Math.min(10, elapsedTimeSeconds));
  const gracePeriod = 0.75;
  const totalTime = 10.0;

  if (t <= gracePeriod) {
    return { basePoints: 100, finalPoints: 100 };
  }

  // Linear decay from 100 down to 50 points over remaining time window
  const remainingWindow = totalTime - gracePeriod; // 9.25s
  const elapsedInWindow = t - gracePeriod;
  const ratio = elapsedInWindow / remainingWindow;
  
  // Points range: 100 -> 50
  const points = Math.max(50, Math.round(100 - (50 * ratio)));

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
